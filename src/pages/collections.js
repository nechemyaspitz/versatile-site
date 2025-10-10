// Collections page: InfiniteScrollProductFilter + Nice Select + filter drawer
import { loadScript, loadStyle } from '../utils/assetLoader.js';
import { setState } from '../core/state.js';
import { setupFilterListeners } from '../components/filterDrawer.js';

// Polyfill for Safari (doesn't support requestIdleCallback)
const safeRequestIdleCallback = window.requestIdleCallback || function(callback, options) {
  const timeout = options?.timeout || 2000;
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 1);
};

// Setup filter accordion interactions
function setupFilterAccordions() {
  if (!window.gsap) return;
  
  const filterHeaders = document.querySelectorAll('.filter-header');
  
  filterHeaders.forEach((header) => {
    // Skip if already initialized
    if (header.dataset.accordionInit === 'true') return;
    
    const filterGroup = header.closest('.filter-group');
    const icon = header.querySelector('.icon-sm');
    
    if (!filterGroup || !icon) return;
    
    // Create timeline for this specific accordion (paused initially)
    const tl = gsap.timeline({ 
      paused: true,
      onComplete: () => { header._isOpen = true; },
      onReverseComplete: () => { header._isOpen = false; }
    });
    
    // Action 1: Animate filter group height
    tl.fromTo(filterGroup, 
      { height: '2em' },
      { 
        height: 'auto',
        duration: 0.25,
        ease: 'power3.inOut'
      },
      0 // Start at time 0
    );
    
    // Action 2: Animate icon rotation (in parallel)
    tl.fromTo(icon,
      { rotation: -90 },
      { 
        rotation: 0,
        duration: 0.25,
        ease: 'power3.inOut'
      },
      0 // Start at time 0 (parallel with action 1)
    );
    
    // Store timeline on the header element
    header._timeline = tl;
    header._isOpen = false;
    
    // Click handler with toggle and mid-animation reversal support
    header.addEventListener('click', () => {
      // Check if animation is currently running
      if (tl.isActive()) {
        // Reverse from current position
        tl.reversed(!tl.reversed());
      } else {
        // Not playing, toggle based on current state
        if (header._isOpen) {
          // Close: reverse the animation
          tl.reverse();
          header._isOpen = false;
        } else {
          // Open: play the animation forward
          tl.play();
          header._isOpen = true;
        }
      }
    });
    
    // Mark as initialized
    header.dataset.accordionInit = 'true';
  });
}

export async function initCollections(isBackButton = false) {
  console.log('🎬 initCollections called with isBackButton:', isBackButton);
  
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
  
  // Filter accordion interactions
  setupFilterAccordions();

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
      this.itemsPerPage = 10; // Testing: 10 items per page for easier testing
      this.isLoading = false;
      this.hasMorePages = true;
      this.totalItems = 0;
      this.niceSelect = null;

      // Lifecycle & caching
      this._ac = new AbortController();
      this._observer = null;
      this._sentinel = null;
      this._respCache = new Map(); // URL -> response data (API cache)
      this._allLoadedItems = []; // Track ALL items across all pages
      this._clickedProductId = null; // For scroll restoration

      // Don't call init() in constructor - will be called by initCollections()
      this._isBackButton = false;
    }

    async init(isBackButton = false) {
      try {
        this._isBackButton = isBackButton;
        console.log('🔍 Navigation type:', isBackButton ? 'BACK BUTTON' : 'REGULAR LINK');
        
        // ONLY restore on back button
        if (isBackButton && this.tryRestoreFromSession()) {
          console.log('✅ Restored from session cache (back button)');
          this.initNiceSelect();
          this.initEventListeners();
          this.initInfiniteScroll();
          return; // Don't fetch - we restored!
        }
        
        // Fresh load (navbar link, direct URL, etc.) - clear old cache
        if (!isBackButton) {
          console.log('🆕 Fresh load - clearing old session data');
          sessionStorage.removeItem('collections_state');
        }
        
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
      
      // Reset all loaded items (fresh render)
      this._allLoadedItems = [...items];
      
      // Build all elements in fragment (off-DOM for performance)
      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const el = this.createProductElement(item);
        fragment.appendChild(el);
      });
      
      // Single DOM append (batch write) - no animations!
      this.productContainer.appendChild(fragment);
      
      // FIX #4: Immediate Lenis resize + continued monitoring
      if (window.lenis) {
        window.lenis.resize();
        // Resize again after a moment (for any delayed renders)
        setTimeout(() => window.lenis.resize(), 50);
        setTimeout(() => window.lenis.resize(), 200);
      }
      
      // Initialize features immediately
      safeRequestIdleCallback(() => {
        this.initImageHover();
        this.updateProductImages();
        this.updateProductLinks();
        this.setupProductClickTracking(); // Track clicks for scroll restoration
        
        // Fix jittery scroll: resize after images load
        this.waitForImagesToLoad();
      }, { timeout: 1000 });
    }

    appendItems(items) {
      // Add to all loaded items
      this._allLoadedItems.push(...items);
      
      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const el = this.createProductElement(item);
        fragment.appendChild(el);
      });
      
      // Batch DOM append - no animations!
      this.productContainer.appendChild(fragment);
      
      // FIX #4: Aggressive Lenis resize after adding items
      if (window.lenis) {
        window.lenis.resize();
        // Multiple resize calls for smooth scroll
        setTimeout(() => window.lenis.resize(), 50);
        setTimeout(() => window.lenis.resize(), 200);
        setTimeout(() => window.lenis.resize(), 500);
      }
      
      // Initialize features for new items
      safeRequestIdleCallback(() => {
        this.initImageHover();
        this.updateProductImages();
        this.updateProductLinks();
        this.setupProductClickTracking(); // Track clicks for scroll restoration
        
        // Fix jittery scroll: resize after images load
        this.waitForImagesToLoad();
      }, { timeout: 1000 });
    }

    createProductElement(item) {
      const productName =
        item.name || item['actual-product-name'] || 'Untitled';
      const mainImage = item.image?.url || 'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
      const productSlug = item.slug || item.webflow_item_id || '';
      const baseUrl = `/collections/${productSlug}`;

      const productItem = document.createElement('div');
      productItem.setAttribute('role', 'listitem');
      productItem.className = 'w-dyn-item';

      productItem.innerHTML = `
        <div class="collection_grid-item" data-base-url="${baseUrl}" data-product-id="${baseUrl}" data-hover-initialized="false">
          <a href="${baseUrl}" class="collection_image-cover">
            <img src="${mainImage}" loading="lazy" alt="${productName}" class="img-2" data-original-src="${mainImage}">
          </a>
          <div class="progressive-blur">
              <div class="blur"></div>
              <div class="blur"></div>
              <div class="blur"></div>
              <div class="blur"></div>
              <div class="blur"></div>
          </div>
          <div class="gradient-cover"></div>
          <div class="collection-overlay">
            <a href="${baseUrl}" class="collection_details">
              <div class="truncate">${productName}</div>
            </a>
            ${this.createProductMetaHTML(item)}
            ${this.createVariantThumbnailsHTML(item.related_items, baseUrl)}
          </div>
        </div>
      `;
      return productItem;
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

    createImageOverlay(imageSrc, imageAlt) {
      return `
        <img 
          src="${imageSrc}" 
          alt="${imageAlt}" 
          loading="lazy"
          class="img-2 overlay-img"
          style="opacity: 0; transition: opacity 0.3s ease;"
        >
      `;
    }

    showImageOverlay(product, imageSrc, imageAlt, isPermanent = false) {
      const imageContainer = product.querySelector('.collection_image-cover');
      if (!imageContainer) return;

      const existingOverlay = imageContainer.querySelector('.overlay-img');
      if (existingOverlay) {
        existingOverlay.style.opacity = '0';
        setTimeout(() => existingOverlay.remove(), 10);
      }

      const overlayHTML = this.createImageOverlay(imageSrc, imageAlt);
      const mainImg = imageContainer.querySelector('.img-2:not(.overlay-img)');
      if (!mainImg) return;
      
      mainImg.insertAdjacentHTML('afterend', overlayHTML);
      const newOverlay = imageContainer.querySelector('.overlay-img');
      
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
    }

    hideImageOverlay(product) {
      const imageContainer = product.querySelector('.collection_image-cover');
      if (!imageContainer) return;
      const overlay = imageContainer.querySelector('.overlay-img');
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
      const mainImg = product.querySelector('.img-2:not(.overlay-img)');
      if (mainImg) {
        mainImg.src = imageSrc;
        mainImg.alt = imageAlt;
      }
    }

    restoreOriginalImage(product) {
      const mainImg = product.querySelector('.img-2:not(.overlay-img)');
      const permanentOverlay = product.querySelector('.overlay-img[data-permanent]');
      if (!mainImg) return;

      const originalSrc = mainImg.dataset.originalSrc;
      const originalAlt = mainImg.alt;

      if (originalSrc) {
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
                '.overlay-img[data-permanent]'
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

    // ====== SESSION RESTORATION METHODS ======
    
    tryRestoreFromSession() {
      try {
        const saved = sessionStorage.getItem('collections_state');
        if (!saved) return false;
        
        const state = JSON.parse(saved);
        const now = Date.now();
        const timeSinceCache = now - state.timestamp;
        
        // FIX #1: Smart cache expiration
        // Detect if this is a page refresh vs back button
        const isPageRefresh = window.performance && 
          (performance.navigation?.type === 1 || performance.getEntriesByType('navigation')[0]?.type === 'reload');
        
        if (isPageRefresh) {
          // On refresh: only restore if <30 seconds old
          if (timeSinceCache > 30000) {
            console.log('🔄 Page refresh + cache expired (>30s), fetching fresh data');
            sessionStorage.removeItem('collections_state');
            return false;
          }
          console.log('🔄 Page refresh but cache is fresh (<30s), restoring');
        } else {
          // On navigation (back button): restore if <10 minutes old
          if (timeSinceCache > 600000) {
            console.log('⏰ Cache expired (>10min), fetching fresh data');
            sessionStorage.removeItem('collections_state');
            return false;
          }
          console.log('⬅️ Back button navigation, restoring from cache');
        }
        
        // FIX #2: Restore ALL state including pagination
        this._allLoadedItems = state.allLoadedItems || [];
        this.activeFilters = state.activeFilters || {};
        this.currentSort = state.currentSort || 'recommended';
        this.currentPage = state.currentPage || 1;
        this.totalItems = state.totalItems || 0;
        this.hasMorePages = state.hasMorePages !== undefined ? state.hasMorePages : true;
        this._clickedProductId = state.clickedProductId || null;
        
        console.log('📦 Restored state:', {
          items: this._allLoadedItems.length,
          totalItems: this.totalItems,
          hasMorePages: this.hasMorePages,
          currentPage: this.currentPage
        });
        
        // Render all items
        if (this._allLoadedItems.length > 0) {
          this.renderItems(this._allLoadedItems);
          this.updateResultsCounter(this.totalItems);
          
          // FIX #3: Scroll to clicked product with Lenis
          if (this._clickedProductId) {
            console.log('🔍 DEBUG: Attempting scroll restoration...');
            console.log('  - Clicked product ID:', this._clickedProductId);
            console.log('  - Lenis available?', !!window.lenis);
            console.log('  - Current scroll:', window.scrollY);
            
            // CRITICAL FIX: Wait for Lenis to become available
            this.waitForLenisAndScroll(this._clickedProductId);
          } else {
            console.log('ℹ️ No clicked product to scroll to');
          }
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Failed to restore from session:', error);
        sessionStorage.removeItem('collections_state');
        return false;
      }
    }
    
    saveToSession() {
      try {
        const state = {
          allLoadedItems: this._allLoadedItems,
          activeFilters: this.activeFilters,
          currentSort: this.currentSort,
          currentPage: this.currentPage,
          totalItems: this.totalItems,
          hasMorePages: this.hasMorePages, // FIX #2: Save pagination state
          clickedProductId: this._clickedProductId,
          timestamp: Date.now()
        };
        
        sessionStorage.setItem('collections_state', JSON.stringify(state));
        console.log('💾 Saved to session:', {
          items: this._allLoadedItems.length,
          totalItems: this.totalItems,
          hasMorePages: this.hasMorePages,
          page: this.currentPage,
          clickedProduct: this._clickedProductId
        });
      } catch (error) {
        console.error('Failed to save to session:', error);
      }
    }
    
    setupProductClickTracking() {
      // Track clicks on product links AND variant thumbnails
      const productLinks = this.productContainer.querySelectorAll('.collection_image-cover, .collection_details, .variant-thumb-link');
      
      console.log(`🔧 Setting up click tracking for ${productLinks.length} links (products + variants)`);
      
      productLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          // Get product ID from the parent grid item
          const gridItem = e.currentTarget.closest('.collection_grid-item');
          if (gridItem) {
            // Use data-product-id attribute (matches what we query for)
            const productId = gridItem.dataset.productId || gridItem.dataset.baseUrl;
            const linkType = e.currentTarget.classList.contains('variant-thumb-link') ? 'variant' : 'product';
            
            console.log(`🖱️ ${linkType} clicked!`);
            console.log('  - Product ID:', productId);
            
            if (productId) {
              this._clickedProductId = productId;
              this.saveToSession();
              console.log('✅ Saved clicked product to session:', productId);
            } else {
              console.warn('⚠️ Could not extract product ID from clicked element');
            }
          } else {
            console.warn('⚠️ Could not find grid item parent');
          }
        });
      });
    }
    
    waitForImagesToLoad() {
      // FIX #4: Aggressive Lenis resize to prevent jittery scroll
      const images = this.productContainer.querySelectorAll('img');
      let loadedCount = 0;
      const totalImages = images.length;
      
      if (totalImages === 0) {
        // No images, but still resize after a moment
        setTimeout(() => {
          if (window.lenis) window.lenis.resize();
        }, 100);
        return;
      }
      
      const checkAllLoaded = () => {
        loadedCount++;
        
        // Resize on EVERY image load (aggressive but smooth)
        if (window.lenis) {
          window.lenis.resize();
        }
        
        if (loadedCount === totalImages) {
          console.log('📸 All images loaded, Lenis fully resized');
        }
      };
      
      images.forEach((img) => {
        if (img.complete) {
          checkAllLoaded();
        } else {
          img.addEventListener('load', checkAllLoaded, { once: true });
          img.addEventListener('error', checkAllLoaded, { once: true }); // Count errors too
        }
      });
    }
    
    waitForLenisAndScroll(productId) {
      // Poll for Lenis to become available, then scroll
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max (50 * 100ms)
      
      const checkLenis = () => {
        attempts++;
        
        if (window.lenis) {
          console.log(`✅ Lenis found after ${attempts} attempts (${attempts * 100}ms)`);
          
          // Wait for DOM to settle, then instant jump
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Force Lenis to recalculate before scrolling
              window.lenis.resize();
              
              const productEl = document.querySelector(`[data-product-id="${productId}"]`);
              console.log('  - Product element found?', !!productEl);
              
              if (productEl) {
                console.log('🎯 Instantly jumping to clicked product:', productId);
                
                // OPTION 1: Instant jump with Lenis (no animation)
                window.lenis.scrollTo(productEl, {
                  immediate: true,  // ← INSTANT jump!
                  offset: -100
                });
                
                console.log('✅ Jumped to position:', window.scrollY);
              } else {
                console.warn('⚠️ Product element not found for scroll:', productId);
                console.warn('  - Available product IDs:', 
                  Array.from(document.querySelectorAll('[data-product-id]'))
                    .map(el => el.dataset.productId)
                    .slice(0, 5)
                );
              }
            });
          });
        } else if (attempts < maxAttempts) {
          // Lenis not ready yet, try again in 100ms
          setTimeout(checkLenis, 100);
        } else {
          // Fallback: Use native scroll if Lenis never loads
          console.warn('⚠️ Lenis not available, using native scroll fallback');
          const productEl = document.querySelector(`[data-product-id="${productId}"]`);
          if (productEl) {
            const rect = productEl.getBoundingClientRect();
            const scrollTop = window.pageYOffset + rect.top - 100;
            window.scrollTo(0, scrollTop);
            console.log('✅ Native scroll to position:', scrollTop);
          }
        }
      };
      
      // Start polling
      checkLenis();
    }

    destroy() {
      // Save state before destroying
      this.saveToSession();
      
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
  // Initialize with back button flag
  await filterInstance.init(isBackButton);
  
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

