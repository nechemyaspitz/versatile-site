// Collections page: InfiniteScrollProductFilter + Nice Select + filter drawer
import { loadScript, loadStyle } from '../utils/assetLoader.js';
import { setState } from '../core/state.js';
import { setupFilterListeners } from '../components/filterDrawer.js';
import { staggerFadeIn, forceGPULayer, deferToIdle } from '../utils/animationOptimizer.js';
import { initLazyLoader, observeElements, cleanupLazyLoader } from '../utils/lazyLoader.js';
import { batchToNextFrame } from '../utils/domBatcher.js';

export async function initCollections(nsCtx) {
  // GSAP for filter drawer, Nice Select assets
  if (!window.gsap) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'
    );
  }
  await loadStyle(
    'https://cdn.jsdelivr.net/npm/nice-select2@2.1.0/dist/css/nice-select2.css'
  );
  if (!window.NiceSelect) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/nice-select2@2.1.0/dist/js/nice-select2.js'
    );
  }

  // If no filter markup (product grid), skip
  const grid = document.querySelector('.product-grid');
  const form = document.getElementById('filters');
  if (!grid || !form) {
    setState('collections', { destroy: () => {} });
    return;
  }

  // Filter drawer listeners (idempotent)
  setupFilterListeners();

  // InfiniteScrollProductFilter class with response caching
  class InfiniteScrollProductFilter {
    constructor() {
      this.productContainer = document.querySelector('.product-grid');
      this.filterForm = document.getElementById('filters');
      this.sortDropdown = document.getElementById('sort-select');
      this.resultsCounter = document.querySelector('[data-results-count]');
      this.clearButton = document.querySelector('.button.alt');

      this.collectionId = 'c09bba8e-4a81-49c2-b722-f1fa46c75861';
      this.baseUrl =
        'https://wmkcwljhyweqzjivbupx.supabase.co/functions/v1/generic-collection-filter';

      this.activeFilters = {};
      this.currentSort = 'recommended';
      this.currentPage = 1;
      this.itemsPerPage = 30;
      this.isLoading = false;
      this.hasMorePages = true;
      this.totalItems = 0;
      this.niceSelect = null;

      // Lifecycle & caching
      this._ac = new AbortController();
      this._observer = null;
      this._sentinel = null;
      this._respCache = new Map(); // URL -> response data

      this.init();
    }

    async init() {
      try {
        this.initNiceSelect();
        this.loadFromURLParams();
        this.initEventListeners();
        this.initInfiniteScroll();
        await this.loadInitialData();
      } catch (error) {
        console.error('Error initializing filter:', error);
        this.handleError(error);
      }
    }

    async loadInitialData() {
      this.currentPage = 1;
      this.hasMorePages = true;
      this.clearProductContainer();
      await this.fetchItems();
    }

    async fetchItems(append = false) {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const url = this.buildRequestUrl();
        
        // Check cache first
        if (this._respCache.has(url)) {
          const data = this._respCache.get(url);
          if (append) this.appendItems(data.items);
          else this.renderItems(data.items);
          this.updatePagination(data.pagination);
          this.updateResultsCounter(data.pagination.total);
          this.updateClearButton();
          this.isLoading = false;
          return;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await this.handleResponse(response);
        
        // Cache the response
        this._respCache.set(url, data);
        
        if (append) {
          this.appendItems(data.items);
        } else {
          this.renderItems(data.items);
        }
        this.updatePagination(data.pagination);
        this.updateResultsCounter(data.pagination.total);
        this.updateClearButton();
      } catch (error) {
        console.error('Fetch error:', error);
        this.handleError(error);
      } finally {
        this.isLoading = false;
      }
    }

    async handleResponse(response) {
      const text = await response.text();
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Please contact support.');
        }
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Invalid response format from server');
      }
    }

    buildRequestUrl() {
      const params = new URLSearchParams({
        collection_id: this.collectionId,
        page: this.currentPage.toString(),
        limit: this.itemsPerPage.toString(),
        sort: this.currentSort,
      });

      Object.entries(this.activeFilters).forEach(
        ([filterType, filterValues]) => {
          if (filterValues.length > 0) {
            const variantFilters = ['colors', 'color', 'size', 'finish'];
            const mainProductMapping = {
              application: 'application-slugs',
              material: 'material',
              featured: 'featured',
              thickness: 'thickness',
            };
            if (variantFilters.includes(filterType)) {
              params.set(`filter_${filterType}`, filterValues.join(','));
            } else {
              const backendField = mainProductMapping[filterType] || filterType;
              params.set(`filter_${backendField}`, filterValues.join(','));
            }
          }
        }
      );

      const config = {
        searchFields: ['name', 'description', 'actual-product-name'],
        sortFields: {
          'a-z': 'name:asc',
          'z-a': 'name:desc',
          recommended: 'sort-order:asc',
          featured: 'featured:desc',
        },
        relatedItems: { enabled: true, relationField: 'variants' },
        relatedItemFields: ['colors', 'color', 'size', 'finish'],
        customFilters: {
          'application-slugs': { type: 'ilike' },
          material: { type: 'exact' },
          featured: { type: 'boolean' },
          thickness: { type: 'numeric' },
          color: { type: 'exact' },
          colors: { type: 'exact' },
          size: { type: 'array_contains' },
          finish: { type: 'array_contains' },
        },
      };

      params.set('config', JSON.stringify(config));
      return `${this.baseUrl}?${params.toString()}`;
    }

    renderItems(items) {
      // Clear container
      this.productContainer.innerHTML = '';
      
      // Build all elements in fragment (off-DOM for performance)
      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const el = this.createProductElement(item);
        fragment.appendChild(el);
      });
      
      // Single DOM append (batch write)
      this.productContainer.appendChild(fragment);
      
      // Get all items for animation
      const allItems = this.productContainer.querySelectorAll('.w-dyn-item');
      
      if (!window.gsap || allItems.length === 0) return;
      
      // CRITICAL FIX: Set initial state on BOTH parent AND child
      // This prevents the "double animation" effect
      gsap.set(allItems, {
        opacity: 0,
        clearProps: 'transition,transform',
      });
      
      // Also set child elements (prevent flash)
      const gridItems = this.productContainer.querySelectorAll('.collection_grid-item');
      gsap.set(gridItems, {
        opacity: 0,
        clearProps: 'transition',
      });
      
      // Start animation IMMEDIATELY
      requestAnimationFrame(() => {
        // Animate parent containers
        gsap.to(allItems, {
          opacity: 1,
          duration: 0.6,
          stagger: 0.03,
          ease: 'power2.out',
        });
        
        // Animate children (slightly delayed for depth)
        gsap.to(gridItems, {
          opacity: 1,
          duration: 0.5,
          stagger: 0.03,
          ease: 'power2.out',
        });
      });
      
      // Defer feature initialization
      setTimeout(() => {
        requestIdleCallback(() => {
          this.initImageHover();
          this.updateProductImages();
          this.updateProductLinks();
        }, { timeout: 2000 });
      }, 100);
    }

    appendItems(items) {
      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const el = this.createProductElement(item);
        fragment.appendChild(el);
      });
      
      // Batch DOM append
      this.productContainer.appendChild(fragment);

      const newItems = Array.from(this.productContainer.children).slice(
        -items.length
      );
      
      if (!window.gsap || newItems.length === 0) return;
      
      // Set initial state on containers AND children
      gsap.set(newItems, {
        opacity: 0,
        clearProps: 'transition',
      });
      
      const newGridItems = [];
      newItems.forEach(item => {
        const gridItem = item.querySelector('.collection_grid-item');
        if (gridItem) newGridItems.push(gridItem);
      });
      
      gsap.set(newGridItems, {
        opacity: 0,
        clearProps: 'transition',
      });
      
      // Animate both
      requestAnimationFrame(() => {
        gsap.to(newItems, {
          opacity: 1,
          duration: 0.5,
          stagger: 0.025,
          ease: 'power2.out',
        });
        
        gsap.to(newGridItems, {
          opacity: 1,
          duration: 0.45,
          stagger: 0.025,
          ease: 'power2.out',
        });
      });
      
      // Defer features
      setTimeout(() => {
        requestIdleCallback(() => {
          this.initImageHover();
          this.updateProductImages();
          this.updateProductLinks();
        }, { timeout: 2000 });
      }, 100);
    }

    createProductElement(item) {
      const productName =
        item.name || item['actual-product-name'] || 'Untitled';
      const mainImage = item.image?.url || null;
      const productSlug = item.slug || item.webflow_item_id || '';
      const baseUrl = `/collections/${productSlug}`;

      const productItem = document.createElement('div');
      productItem.setAttribute('role', 'listitem');
      productItem.className = 'w-dyn-item';
      // Don't set any inline opacity - let GSAP control it completely

      productItem.innerHTML = `
        <div class="collection_grid-item" data-base-url="${baseUrl}" style="view-transition-name: ${productSlug};" data-hover-initialized="false">
          <a href="${baseUrl}" class="collection_image-cover" style="display: block; color: inherit; text-decoration: none;">
            <img src="https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg" loading="lazy" alt="" class="thumbnail-cover-img overlay-1">
            <img src="https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg" loading="lazy" alt="" class="thumbnail-cover-img overlay-2">
            ${this.createProgressiveBlurHTML(mainImage, productName)}
          </a>
          <div class="gradient-cover"></div>
          <div class="collection-overlay">
            <a href="${baseUrl}" class="collection_details" style="display: block; text-decoration: none;">
              <div class="truncate">${productName}</div>
            </a>
            ${this.createProductMetaHTML(item)}
            ${this.createVariantThumbnailsHTML(item.related_items, baseUrl)}
          </div>
        </div>
      `;
      return productItem;
    }

    createProgressiveBlurHTML(imageSrc, imageAlt) {
      const safeImageSrc =
        imageSrc ||
        'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
      const safeImageAlt = imageAlt || 'product-image';
      
      // Keep inline styles - they're needed for the progressive blur to work
      return `
        <div class="progressive-img-blur w-embed">
          <div class="blur-img">
            <div class="progressive-blur" style="--bg: url('${safeImageSrc}');" data-original-bg="${safeImageSrc}">
              <div class="blur"></div>
              <div class="blur"></div>
              <div class="blur"></div>
              <div class="blur"></div>
            </div>
            <img src="${safeImageSrc}" alt="${safeImageAlt}" data-original-src="${safeImageSrc}" data-original-alt="${safeImageAlt}">
          </div>
          <style>
            .blur-img { position: absolute; inset: 0; overflow: hidden; border-radius: 0px; width: 100%; height: 100%; z-index: 0; transition: opacity 0.2s; }
            .blur-img.top { z-index: 1; }
            .blur-img img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.06); }
            .progressive-blur { position: absolute; z-index: 6; width: 100%; height: 100%; pointer-events: none; inset: auto 0 0 0; transform: scale(1.06); }
            .blur { background: var(--bg); background-size: cover; position: absolute; background-position: center center; inset: 0; }
            .progressive-blur>div:nth-child(1) { filter: blur(2px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,1) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 88%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,1) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 88%); z-index: 1; }
            .progressive-blur>div:nth-child(2) { filter: blur(4px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 94%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 94%); z-index: 2; }
            .progressive-blur>div:nth-child(3) { filter: blur(8px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%); z-index: 3; }
            .progressive-blur>div:nth-child(4) { filter: blur(16px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,1) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,1) 100%); z-index: 4; }
            .progressive-blur>div:nth-child(5) { filter: blur(32px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 94%, rgba(0,0,0,1) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 94%, rgba(0,0,0,1) 100%); z-index: 5; }
          </style>
        </div>
      `;
    }

    createProductMetaHTML(item) {
      const thickness = item.thickness || '';
      const applications = item['application-slugs'] || '';
      const material = item.material || '';
      const isFeatured = item.featured || false;
      return `
        <div data-thickness="${thickness}" data-applications="${applications}" data-material="${material}" class="product-meta">
          ${isFeatured ? '<div class="is-featured-flag"></div>' : ''}
        </div>
      `;
    }

    createVariantThumbnailsHTML(relatedItems, baseUrl) {
      if (!relatedItems || relatedItems.length === 0) {
        return `
          <div class="collection-list-wrapper w-dyn-list">
            <div role="list" class="variant_thumbnail-list w-dyn-items"></div>
          </div>
        `;
      }
      const variantHTML = relatedItems
        .map((variant) => {
          const imageSrc =
            variant['image-3']?.url ||
            'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
          const finishes = variant['finish-slugs'] || '';
          const color = this.extractColorName(variant.color, variant.slug);
          const sizes = variant['size-slugs'] || '';
          const name =
            variant.name || variant.slug || variant.webflow_item_id || '';
          const variantSlug = variant.slug || variant.webflow_item_id || '';
          const variantUrl = variantSlug
            ? `${baseUrl}?variant=${variantSlug}`
            : baseUrl;
          return `
            <div role="listitem" class="w-dyn-item">
              <a href="${variantUrl}" class="variant-thumb-link" style="display: block; line-height: 0;">
                <img src="${imageSrc}" loading="lazy" alt="${name}" class="variant-thumb" style="cursor: pointer;">
              </a>
              <div data-finishes="${finishes}" data-name="${name}" data-slug="${variantSlug}" data-color="${color}" data-sizes="${sizes}" class="variant-meta"></div>
            </div>
          `;
        })
        .join('');
      return `
        <div class="collection-list-wrapper w-dyn-list">
          <div role="list" class="variant_thumbnail-list w-dyn-items">
            ${variantHTML}
          </div>
        </div>
      `;
    }

    extractColorName(colorId, slug) {
      const colorMap = {
        blue: 'blue',
        green: 'green',
        black: 'black',
        white: 'white',
        grey: 'grey',
        gray: 'grey',
      };
      const lowerSlug = (slug || '').toLowerCase();
      for (const [key, value] of Object.entries(colorMap)) {
        if (lowerSlug.includes(key)) return value;
      }
      return colorId || '';
    }

    normalizeFilterKey(name) {
      const key = (name || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
      if (key === 'color' || key === 'colors') return 'colors';
      if (key === 'size' || key === 'sizes') return 'size';
      if (key === 'finish' || key === 'finishes') return 'finish';
      if (key === 'material' || key === 'materials') return 'material';
      if (key === 'application' || key === 'applications')
        return 'application';
      return key;
    }

    updateFilters() {
      this.activeFilters = {};
      const checkedInputs = this.filterForm.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      checkedInputs.forEach((input) => {
        const filterTypeRaw = input.name;
        const filterValue = input.value;
        const filterType = this.normalizeFilterKey(filterTypeRaw);
        if (!this.activeFilters[filterType]) {
          this.activeFilters[filterType] = [];
        }
        this.activeFilters[filterType].push(filterValue);
      });
      this.updateFilterChips();
    }

    async applyFilters() {
      await this.loadInitialData();
      this.updateURLParams();
      this.updateProductLinks();
    }

    updateProductImages() {
      const colorFilters =
        this.activeFilters.colors || this.activeFilters.color;
      const currentProducts = document.querySelectorAll(
        '.collection_grid-item'
      );
      currentProducts.forEach((product, index) => {
        setTimeout(() => {
          if (colorFilters && colorFilters.length === 1) {
            const colorImage = this.getVariantImageForColor(
              product,
              colorFilters[0]
            );
            if (colorImage) {
              this.showImageOverlay(
                product,
                colorImage.src,
                colorImage.alt,
                true
              );
            }
          } else {
            this.restoreOriginalImage(product);
          }
        }, index * 1);
      });
    }

    getVariantImageForColor(product, colorFilter) {
      const variantThumbs = product.querySelectorAll('.variant-thumb');
      const normalizedColorFilter = colorFilter.toLowerCase();
      for (const thumb of variantThumbs) {
        const variantMeta = thumb.nextElementSibling;
        if (!variantMeta || !variantMeta.classList.contains('variant-meta'))
          continue;
        const colors = variantMeta.getAttribute('data-color');
        if (!colors) continue;
        const variantColors = colors
          .split(',')
          .map((c) => c.trim().toLowerCase());
        if (variantColors.includes(normalizedColorFilter)) {
          return { src: thumb.src, alt: thumb.alt };
        }
      }
      return null;
    }

    createBlurImageOverlay(imageSrc, imageAlt) {
      return `
        <div class="blur-img top" style="opacity: 0; transition: opacity 0.3s ease;">
          <div class="progressive-blur" style="--bg: url('${imageSrc}');">
            <div class="blur"></div>
            <div class="blur"></div>
            <div class="blur"></div>
            <div class="blur"></div>
          </div>
          <img src="${imageSrc}" alt="${imageAlt}">
        </div>
      `;
    }

    showImageOverlay(product, imageSrc, imageAlt, isPermanent = false) {
      const imageContainer =
        product.querySelector('.progressive-img-blur');
      if (!imageContainer) return;

      const existingOverlay = imageContainer.querySelector('.blur-img.top');
      if (existingOverlay) {
        existingOverlay.style.opacity = '0';
        setTimeout(() => existingOverlay.remove(), 10);
      }

      setTimeout(() => {
        const overlayHTML = this.createBlurImageOverlay(
          imageSrc,
          imageAlt
        );
        const mainBlurImg = imageContainer.querySelector(
          '.blur-img:not(.top)'
        );
        if (!mainBlurImg) return;
        mainBlurImg.insertAdjacentHTML('afterend', overlayHTML);
        const newOverlay = imageContainer.querySelector('.blur-img.top');
        if (newOverlay) {
          requestAnimationFrame(() => {
            newOverlay.style.opacity = '1';
            product.dataset.hasOverlay = 'true';
            if (isPermanent) {
              newOverlay.dataset.permanent = 'true';
              setTimeout(() => {
                this.replaceMainImage(product, imageSrc, imageAlt);
              }, 300);
            }
          });
        }
      }, isPermanent ? 0 : 50);
    }

    hideImageOverlay(product) {
      const imageContainer =
        product.querySelector('.progressive-img-blur');
      if (!imageContainer) return;
      const overlay = imageContainer.querySelector('.blur-img.top');
      if (overlay && !overlay.dataset.permanent) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.remove();
            product.removeAttribute('data-has-overlay');
          }
        }, 300);
      }
    }

    replaceMainImage(product, imageSrc, imageAlt) {
      const mainImg = product.querySelector('.blur-img:not(.top) img');
      const progressiveBlur = product.querySelector(
        '.blur-img:not(.top) .progressive-blur'
      );
      if (mainImg) {
        mainImg.src = imageSrc;
        mainImg.alt = imageAlt;
      }
      if (progressiveBlur) {
        progressiveBlur.style.setProperty('--bg', `url('${imageSrc}')`);
      }
    }

    restoreOriginalImage(product) {
      const mainImg = product.querySelector('.blur-img:not(.top) img');
      const progressiveBlur = product.querySelector(
        '.blur-img:not(.top) .progressive-blur'
      );
      const permanentOverlay = product.querySelector(
        '.blur-img.top[data-permanent]'
      );
      if (!mainImg || !progressiveBlur) return;

      const originalSrc = mainImg.dataset.originalSrc;
      const originalAlt = mainImg.dataset.originalAlt;
      const originalBg = progressiveBlur.dataset.originalBg;

      if (originalSrc && originalBg) {
        if (permanentOverlay) {
          permanentOverlay.style.opacity = '0';
          setTimeout(() => {
            if (permanentOverlay.parentNode) {
              permanentOverlay.remove();
              product.removeAttribute('data-has-overlay');
            }
          }, 300);
        }
        setTimeout(() => {
          this.replaceMainImage(product, originalSrc, originalAlt);
        }, permanentOverlay ? 300 : 0);
      }
    }

    animateItemsIn() {
      // This method is now called directly in renderItems
      // Keeping it here for consistency but it's a no-op
      return;
    }

    initImageHover() {
      const currentProducts = document.querySelectorAll(
        '.collection_grid-item'
      );
      
      // Process in chunks to avoid blocking main thread
      const chunkSize = 5;
      let index = 0;
      
      const processChunk = () => {
        const chunk = Array.from(currentProducts).slice(index, index + chunkSize);
        
        chunk.forEach((product) => {
          if (product.dataset.hoverInitialized === 'true') return;

          const variantThumbs = product.querySelectorAll('.variant-thumb');
          const thumbnailContainer = product.querySelector(
            '.variant_thumbnail-list'
          );
          if (variantThumbs.length === 0) return;

          let hideTimeout;
          let isHoveringThumbnails = false;

          if (thumbnailContainer) {
            // Use passive listeners for better scroll performance
            thumbnailContainer.addEventListener('mouseenter', () => {
              isHoveringThumbnails = true;
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
              }
            }, { passive: true });
            
            thumbnailContainer.addEventListener('mouseleave', () => {
              isHoveringThumbnails = false;
              hideTimeout = setTimeout(() => {
                this.hideImageOverlay(product);
              }, 200);
            }, { passive: true });
          }

          variantThumbs.forEach((thumb) => {
            thumb.addEventListener('mouseenter', () => {
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
              }
              const permanentOverlay = product.querySelector(
                '.blur-img.top[data-permanent]'
              );
              if (!permanentOverlay) {
                this.showImageOverlay(product, thumb.src, thumb.alt, false);
              }
            }, { passive: true });

            thumb.addEventListener('mouseleave', () => {
              if (!isHoveringThumbnails) {
                hideTimeout = setTimeout(() => {
                  this.hideImageOverlay(product);
                }, 200);
              }
            }, { passive: true });
          });

          product.dataset.hoverInitialized = 'true';
        });
        
        index += chunkSize;
        
        // Process next chunk in next frame (avoid blocking)
        if (index < currentProducts.length) {
          requestAnimationFrame(processChunk);
        }
      };
      
      // Start processing first chunk
      if (currentProducts.length > 0) {
        requestAnimationFrame(processChunk);
      }
    }

    initProductNavigation() {
      // intentionally not used (native links handle nav)
    }

    getVariantsForColor(gridItem, colorFilter) {
      const variantThumbs = gridItem.querySelectorAll('.variant-thumb');
      const matching = [];
      variantThumbs.forEach((thumb) => {
        const meta = thumb.nextElementSibling;
        if (!meta || !meta.classList.contains('variant-meta')) return;
        const colors = meta.getAttribute('data-color');
        const variantSlug = meta.getAttribute('data-slug');
        if (!colors || !variantSlug) return;
        const variantColors = colors
          .split(',')
          .map((c) => c.trim().toLowerCase());
        if (variantColors.includes(colorFilter)) matching.push(variantSlug);
      });
      return matching;
    }

    updateProductLinks() {
      const colorFilters =
        this.activeFilters.colors || this.activeFilters.color;
      const currentProducts = document.querySelectorAll(
        '.collection_grid-item'
      );
      currentProducts.forEach((product) => {
        const baseUrl = product.dataset.baseUrl;
        if (!baseUrl) return;
        let mainUrl = baseUrl;
        if (colorFilters && colorFilters.length === 1) {
          const matching = this.getVariantsForColor(
            product,
            colorFilters[0].toLowerCase()
          );
          if (matching.length === 1) {
            mainUrl = `${baseUrl}?variant=${matching[0]}`;
          }
        }
        const imageCover = product.querySelector('.collection_image-cover');
        const details = product.querySelector('.collection_details');
        if (imageCover && imageCover.tagName === 'A') imageCover.href = mainUrl;
        if (details && details.tagName === 'A') details.href = mainUrl;
      });
    }

    initNiceSelect() {
      if (this.sortDropdown && typeof NiceSelect !== 'undefined') {
        try {
          this.niceSelect = NiceSelect.bind(this.sortDropdown, {
            searchable: false,
            placeholder: 'Select...',
            searchtext: 'Search',
            selectedtext: 'geselecteerd',
          });
        } catch (error) {
          console.error('Failed to initialize Nice Select 2:', error);
        }
      }
    }

    updateNiceSelect(newValue) {
      if (this.sortDropdown) {
        try {
          this.sortDropdown.value = newValue;
          if (this.niceSelect) this.niceSelect.update();
        } catch (error) {
          console.error('Failed to update Nice Select:', error);
        }
      }
    }

    initEventListeners() {
      if (this.filterForm) {
        this.filterForm.addEventListener(
          'change',
          async (e) => {
            if (e.target.type === 'checkbox') {
              this.updateFilters();
              await this.applyFilters();
            }
          },
          { signal: this._ac.signal }
        );
      }

      if (this.sortDropdown) {
        this.sortDropdown.addEventListener(
          'change',
          async (e) => {
            this.currentSort = e.target.value;
            await this.applyFilters();
          },
          { signal: this._ac.signal }
        );
      }

      if (this.clearButton) {
        this.clearButton.addEventListener(
          'click',
          async (e) => {
            e.preventDefault();
            await this.clearAllFilters();
          },
          { signal: this._ac.signal }
        );
      }

      this.initFilterChipEvents();
    }

    initInfiniteScroll() {
      this._observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              this.hasMorePages &&
              !this.isLoading
            ) {
              this.currentPage++;
              this.fetchItems(true);
            }
          });
        },
        { rootMargin: '100px', threshold: 0.1 }
      );

      this._sentinel = document.createElement('div');
      this._sentinel.style.height = '1px';
      this._sentinel.style.position = 'absolute';
      this._sentinel.style.bottom = '100px';
      this._sentinel.style.width = '100%';

      if (this.productContainer && this.productContainer.parentNode) {
        this.productContainer.parentNode.appendChild(this._sentinel);
        this._observer.observe(this._sentinel);
      }
    }

    updatePagination(pagination) {
      if (pagination) {
        this.totalItems = pagination.total || 0;
        this.hasMorePages = pagination.hasMore || false;
      }
    }

    updateURLParams() {
      const params = new URLSearchParams();
      Object.entries(this.activeFilters).forEach(
        ([filterType, filterValues]) => {
          if (filterValues.length > 0) {
            params.set(filterType, filterValues.join(','));
          }
        }
      );
      if (this.currentSort !== 'recommended') {
        params.set('sort', this.currentSort);
      }
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    loadFromURLParams() {
      const params = new URLSearchParams(window.location.search);
      const sortParam = params.get('sort');
      if (sortParam) {
        this.currentSort = sortParam;
        this.updateNiceSelect(sortParam);
      }
      const aliasMap = {
        color: ['color', 'colors', 'Color', 'Colors'],
        colors: ['colors', 'color', 'Colors', 'Color'],
        size: ['size', 'sizes', 'Size', 'Sizes'],
        sizes: ['sizes', 'size', 'Sizes', 'Size'],
        finish: ['finish', 'finishes', 'Finish', 'Finishes'],
        finishes: ['finishes', 'finish', 'Finishes', 'Finish'],
        application: [
          'application',
          'applications',
          'Application',
          'Applications',
        ],
        applications: [
          'applications',
          'application',
          'Applications',
          'Application',
        ],
        'application-slugs': [
          'application',
          'applications',
          'Application',
          'Applications',
        ],
        material: [
          'material',
          'materials',
          'Material',
          'Materials',
          'material-type',
          'materialtype',
        ],
        materials: [
          'materials',
          'material',
          'Materials',
          'Material',
          'material-type',
          'materialtype',
        ],
        thickness: ['thickness', 'Thickness'],
      };
      let filtersApplied = false;
      for (const [key, value] of params.entries()) {
        if (
          ['sort', 'page', 'limit', 'config', 'collection_id'].includes(key)
        )
          continue;
        if (!value) continue;
        const values = value.split(',');
        const candidateNames = aliasMap[key] || [key];
        values.forEach((v) => {
          let checkbox = null;
          for (const name of candidateNames) {
            checkbox = this.filterForm?.querySelector(
              `input[name="${name}"][value="${v}"]`
            );
            if (checkbox) break;
          }
          if (checkbox) {
            checkbox.checked = true;
            filtersApplied = true;
          }
        });
      }
      if (filtersApplied) this.updateFilters();
      else this.updateFilterChips();
    }

    updateResultsCounter(count) {
      if (this.resultsCounter) this.resultsCounter.textContent = count;
    }

    updateClearButton() {
      if (this.clearButton) {
        const has = Object.keys(this.activeFilters).length > 0;
        this.clearButton.style.opacity = has ? '1' : '0.5';
        this.clearButton.disabled = !has;
      }
    }

    async clearAllFilters() {
      const checkboxes = this.filterForm.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      checkboxes.forEach((checkbox) => (checkbox.checked = false));
      this.currentSort = 'recommended';
      this.updateNiceSelect('recommended');
      this.updateFilters();
      await this.applyFilters();
    }

    clearProductContainer() {
      if (this.productContainer) this.productContainer.innerHTML = '';
    }

    updateFilterChips() {
      const chipContainer = document.querySelector('.filter-chip-group');
      if (!chipContainer) return;
      chipContainer.innerHTML = '';
      Object.entries(this.activeFilters).forEach(
        ([filterType, filterValues]) => {
          filterValues.forEach((value) => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-chip-value', value);
            chip.setAttribute('data-chip-filter', filterType);
            const displayValue = this.getDisplayValueForFilter(
              value,
              filterType
            );
            chip.innerHTML = `
              <div class="remove-btn"><div class="text-block-4">x</div></div>
              <div>${displayValue}</div>
            `;
            chipContainer.appendChild(chip);
          });
        }
      );
    }

    getDisplayValueForFilter(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    initFilterChipEvents() {
      document.addEventListener(
        'click',
        async (e) => {
          const removeBtn = e.target.closest('.remove-btn');
          if (!removeBtn) return;
          const chip = removeBtn.closest('.filter-chip');
          if (!chip) return;
          const filterType = chip.getAttribute('data-chip-filter');
          const filterValue = chip.getAttribute('data-chip-value');
          await this.removeFilter(filterType, filterValue);
        },
        { signal: this._ac.signal }
      );
    }

    async removeFilter(filterType, filterValue) {
      const aliasMap = {
        colors: ['color', 'colors', 'Color', 'Colors'],
        color: ['color', 'colors', 'Color', 'Colors'],
        size: ['size', 'sizes', 'Size', 'Sizes'],
        finish: ['finish', 'finishes', 'Finish', 'Finishes'],
        application: ['application', 'applications', 'Application', 'Applications'],
        material: [
          'material',
          'materials',
          'Material',
          'Materials',
          'material-type',
          'materialtype',
        ],
        thickness: ['thickness', 'Thickness'],
      };
      const candidateNames = aliasMap[filterType] || [filterType];
      let checkbox = null;
      for (const name of candidateNames) {
        checkbox = this.filterForm?.querySelector(
          `input[name="${name}"][value="${filterValue}"]`
        );
        if (checkbox) break;
      }
      if (checkbox) {
        checkbox.checked = false;
        this.updateFilters();
        await this.applyFilters();
      }
    }

    handleError(error) {
      console.error('Filter error:', error);
      if (this.productContainer) {
        this.productContainer.innerHTML = `
          <div class="error-message" style="grid-column:1 / -1; text-align:center; padding:2rem; background:#fee; border:1px solid #fcc; border-radius:8px; color:#c33;">
            <h3>Error loading products</h3>
            <p>${error.message}</p>
            <button onclick="window.location.reload()" style="margin-top:1rem; padding:0.5rem 1rem; background:#c33; color:white; border:none; border-radius:4px; cursor:pointer;">Reload Page</button>
          </div>
        `;
      }
    }

    destroy() {
      try {
        this._ac?.abort?.();
      } catch (e) {}
      try {
        this._observer?.disconnect?.();
      } catch (e) {}
      try {
        this._sentinel?.remove?.();
      } catch (e) {}
    }
  }

  const filterInstance = new InfiniteScrollProductFilter();
  // Make available globally and store constructor for snapshot restoration
  window.productFilter = filterInstance;
  window.InfiniteScrollProductFilter = filterInstance;

  setState('collections', {
    destroy: () => {
      try {
        filterInstance.destroy();
      } catch (e) {}
    },
  });
}

