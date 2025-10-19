/**
 * CollectionInteractions.js
 * Handles all user interactions: filters, sorting, image hover, NiceSelect
 */

export class CollectionInteractions {
  constructor(page) {
    this.page = page; // Reference to CollectionsPage
    this.filterForm = document.getElementById('filters');
    this.sortDropdown = document.getElementById('sort-select');
    this.clearButton = document.querySelector('.button.alt');
    this.productContainer = document.querySelector('.product-grid');
    this.niceSelect = null;
    this._ac = new AbortController();
    
  }
  
  /**
   * Initialize all interactions
   */
  init() {
    // Try to initialize NiceSelect immediately
    this.initNiceSelect();
    
    // Retry after a short delay if it failed (library might not be loaded yet)
    if (!this.niceSelect) {
      setTimeout(() => {
        this.initNiceSelect();
      }, 500);
    }
    
    this.initEventListeners();
    this.initFilterChipEvents();
    this.setupProductClickTracking();
  }
  
  // ===== NICE SELECT =====
  
  initNiceSelect() {
    if (!this.sortDropdown) {
      return;
    }
    
    if (typeof NiceSelect === 'undefined') {
      return;
    }
    
    try {
      // CRITICAL FIX: Always destroy existing NiceSelect instance first
      // (prevents issues when navigating back via popstate)
      const existingWrapper = this.sortDropdown.parentElement?.querySelector('.nice-select');
      if (existingWrapper) {
        existingWrapper.remove();
      }
      
      // Reset the select element (NiceSelect hides it)
      this.sortDropdown.style.display = '';
      
      
      this.niceSelect = NiceSelect.bind(this.sortDropdown, {
        searchable: false,
        placeholder: 'Select...',
        searchtext: 'Search',
        selectedtext: 'geselecteerd',
      });
      
    } catch (error) {
      console.error('  ❌ Failed to initialize Nice Select 2:', error);
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
  
  /**
   * Sync UI elements (checkboxes, dropdown) with current state
   * Called after loading from URL params or cache
   */
  syncUIWithState() {
    // 1. Update sort dropdown value and NiceSelect
    const currentSort = this.page.state.getCurrentSort();
    this.updateNiceSelect(currentSort);
    
    // 2. Update filter checkboxes
    const activeFilters = this.page.state.getActiveFilters();
    
    // First, uncheck all
    if (this.filterForm) {
      const allCheckboxes = this.filterForm.querySelectorAll('input[type="checkbox"]');
      allCheckboxes.forEach(cb => cb.checked = false);
    }
    
    // Then check the active ones
    const aliasMap = {
      colors: ['color', 'colors', 'Color', 'Colors'],
      color: ['color', 'colors', 'Color', 'Colors'],
      size: ['size', 'sizes', 'Size', 'Sizes'],
      finish: ['finish', 'finishes', 'Finish', 'Finishes'],
      application: ['application', 'applications', 'Application', 'Applications'],
      material: ['material', 'materials', 'Material', 'Materials'],
      thickness: ['thickness', 'Thickness'],
    };
    
    Object.entries(activeFilters).forEach(([filterType, filterValues]) => {
      const candidateNames = aliasMap[filterType] || [filterType];
      filterValues.forEach((value) => {
        let checkbox = null;
        for (const name of candidateNames) {
          checkbox = this.filterForm?.querySelector(
            `input[name="${name}"][value="${value}"]`
          );
          if (checkbox) break;
        }
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    });
    
    // 3. Update filter chips
    this.updateFilterChips();
    
  }
  
  // ===== EVENT LISTENERS =====
  
  initEventListeners() {
    // Filter checkboxes
    if (this.filterForm) {
      this.filterForm.addEventListener(
        'change',
        async (e) => {
          if (e.target.type === 'checkbox') {
            this.updateFiltersFromCheckboxes();
            await this.applyFilters();
          }
        },
        { signal: this._ac.signal }
      );
    }
    
    // Sort dropdown
    if (this.sortDropdown) {
      this.sortDropdown.addEventListener(
        'change',
        async (e) => {
          this.page.state.setCurrentSort(e.target.value);
          await this.applyFilters();
        },
        { signal: this._ac.signal }
      );
    }
    
    // Clear button
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
    
  }
  
  // ===== FILTER MANAGEMENT =====
  
  updateFiltersFromCheckboxes() {
    const activeFilters = {};
    const checkedInputs = this.filterForm.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    checkedInputs.forEach((input) => {
      const filterTypeRaw = input.name;
      const filterValue = input.value;
      const filterType = this.normalizeFilterKey(filterTypeRaw);
      if (!activeFilters[filterType]) {
        activeFilters[filterType] = [];
      }
      activeFilters[filterType].push(filterValue);
    });
    this.page.state.setActiveFilters(activeFilters);
    this.updateFilterChips();
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
  
  async applyFilters() {
    // Abort any pending requests
    if (this.page.api.abortController) {
      this.page.api.abortController.abort();
    }
    this.page.api.abortController = new AbortController();
    
    // Reset pagination
    this.page.state.setCurrentPage(1);
    this.page.state.setItems([]);
    
    // Clear container
    this.page.renderer.container.innerHTML = '';
    
    // CRITICAL FIX: Check cache BEFORE fetching!
    // Generate cache key based on NEW filter state (before URL is updated)
    const cacheData = this.page.cache.restore(false, this.page.state);
    
    if (cacheData) {
      // Cache hit! Restore state and render
      this.page.state.fromJSON(cacheData);
      await this.page.renderer.renderItems(this.page.state.getItems(), true);
      this.page.updateUI();
      
      // Initialize interactions for restored items
      this.setupProductClickTracking();
      this.initImageHover();
      this.updateProductImages();
      this.updateProductLinks();
      
    } else {
      // Cache miss! Fetch fresh data
      await this.page.fetchItems(false);
    }
    
    // Update URL
    this.updateURLParams();
    
    // Update product links (for variants with query params)
    this.updateProductLinks();
  }
  
  async clearAllFilters() {
    const checkboxes = this.filterForm.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    checkboxes.forEach((checkbox) => (checkbox.checked = false));
    this.page.state.setCurrentSort('recommended');
    this.updateNiceSelect('recommended');
    this.updateFiltersFromCheckboxes();
    await this.applyFilters();
  }
  
  // ===== FILTER CHIPS =====
  
  updateFilterChips() {
    const chipContainer = document.querySelector('.filter-chip-group');
    if (!chipContainer) return;
    chipContainer.innerHTML = '';
    const activeFilters = this.page.state.getActiveFilters();
    Object.entries(activeFilters).forEach(
      ([filterType, filterValues]) => {
        filterValues.forEach((value) => {
          const chip = document.createElement('div');
          chip.className = 'filter-chip';
          chip.setAttribute('data-chip-value', value);
          chip.setAttribute('data-chip-filter', filterType);
          const displayValue = value.charAt(0).toUpperCase() + value.slice(1);
          chip.innerHTML = `
            <div class="remove-btn"><div class="text-block-4">x</div></div>
            <div>${displayValue}</div>
          `;
          chipContainer.appendChild(chip);
        });
      }
    );
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
      this.updateFiltersFromCheckboxes();
      await this.applyFilters();
    }
  }
  
  // ===== URL PARAMS =====
  
  updateURLParams() {
    const params = new URLSearchParams();
    const activeFilters = this.page.state.getActiveFilters();
    Object.entries(activeFilters).forEach(
      ([filterType, filterValues]) => {
        if (filterValues.length > 0) {
          params.set(filterType, filterValues.join(','));
        }
      }
    );
    const currentSort = this.page.state.getCurrentSort();
    if (currentSort !== 'recommended') {
      params.set('sort', currentSort);
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }
  
  // ===== PRODUCT LINKS & IMAGES =====
  
  updateProductLinks() {
    const currentProducts = document.querySelectorAll('.collection_grid-item');
    const activeFilters = this.page.state.getActiveFilters();
    const colorFilters = activeFilters.colors || activeFilters.color;
    
    currentProducts.forEach((product) => {
      const baseUrl = product.dataset.baseUrl || '';
      const productLinks = product.querySelectorAll(
        '.collection_image-cover, .collection_details'
      );
      
      // Determine main product URL
      let mainUrl = baseUrl;
      
      // If single color filter, link to that color variant
      if (colorFilters && colorFilters.length === 1) {
        const matching = this.getVariantsForColor(product, colorFilters[0].toLowerCase());
        if (matching.length === 1) {
          mainUrl = `${baseUrl}?variant=${matching[0]}`;
        }
      }
      
      // Update main product links (image cover + details)
      productLinks.forEach((link) => {
        link.href = mainUrl;
      });
      
      // IMPORTANT: Leave variant thumbnail links unchanged!
      // They already have ?variant=xxx in their href from createVariantThumbnailsHTML
      // We don't want to strip that out
    });
  }
  
  getVariantsForColor(gridItem, colorFilter) {
    const variantThumbs = gridItem.querySelectorAll('.variant-thumb');
    const matching = [];
    variantThumbs.forEach((thumb) => {
      const variantMeta = thumb.closest('.w-dyn-item')?.querySelector('.variant-meta');
      if (!variantMeta) return;
      const color = variantMeta.getAttribute('data-color');
      const slug = variantMeta.getAttribute('data-slug');
      if (!color || !slug) return;
      const variantColors = color.split(',').map((c) => c.trim().toLowerCase());
      if (variantColors.includes(colorFilter)) {
        matching.push(slug);
      }
    });
    return matching;
  }
  
  updateProductImages() {
    const colorFilters =
      this.page.state.getActiveFilters().colors || this.page.state.getActiveFilters().color;
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
  
  // ===== IMAGE HOVER =====
  
  initImageHover() {
    const currentProducts = document.querySelectorAll('.collection_grid-item');
    
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
  
  // ===== PRODUCT CLICK TRACKING (for scroll restoration) =====
  
  setupProductClickTracking() {
    const productLinks = this.productContainer.querySelectorAll('.collection_image-cover, .collection_details, .variant-thumb-link');
    
    productLinks.forEach((link) => {
      // Remove old listener first (if any)
      link.removeEventListener('click', this._productClickHandler);
      
      // Add new listener
      link.addEventListener('click', this._productClickHandler);
    });
    
  }
  
  _productClickHandler = (e) => {
    const gridItem = e.currentTarget.closest('.collection_grid-item');
    if (gridItem) {
      const productId = gridItem.dataset.productId || gridItem.dataset.baseUrl;
      if (productId) {
        this.page.state.setClickedProductId(productId);
        this.page.cache.save(this.page.state);
      }
    }
  }
  
  // ===== CLEANUP =====
  
  destroy() {
    this._ac.abort();
    
    // Destroy NiceSelect instance
    if (this.niceSelect) {
      try {
        // Remove the NiceSelect wrapper
        const wrapper = this.sortDropdown?.parentElement?.querySelector('.nice-select');
        if (wrapper) {
          wrapper.remove();
        }
        
        // Reset the select element
        if (this.sortDropdown) {
          this.sortDropdown.style.display = '';
        }
        
        this.niceSelect = null;
      } catch (error) {
        console.error('Failed to destroy NiceSelect:', error);
      }
    }
    
  }
}

