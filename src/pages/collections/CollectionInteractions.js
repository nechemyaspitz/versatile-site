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
    
    console.log('🎮 CollectionInteractions initialized');
  }
  
  /**
   * Initialize all interactions
   */
  init() {
    this.initNiceSelect();
    this.initEventListeners();
    this.initFilterChipEvents();
    this.setupProductClickTracking();
  }
  
  // ===== NICE SELECT =====
  
  initNiceSelect() {
    if (this.sortDropdown && typeof NiceSelect !== 'undefined') {
      try {
        this.niceSelect = NiceSelect.bind(this.sortDropdown, {
          searchable: false,
          placeholder: 'Select...',
          searchtext: 'Search',
          selectedtext: 'geselecteerd',
        });
        console.log('  ✅ NiceSelect initialized');
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
  
  /**
   * Sync UI elements (checkboxes, dropdown) with current state
   * Called after loading from URL params or cache
   */
  syncUIWithState() {
    // 1. Update sort dropdown value first
    const currentSort = this.page.state.getCurrentSort();
    if (this.sortDropdown) {
      this.sortDropdown.value = currentSort;
    }
    
    // 2. Re-initialize NiceSelect to reflect the new value
    // (NiceSelect might not have been initialized yet on first call)
    this.initNiceSelect();
    
    // 3. Update filter checkboxes
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
    
    console.log('  ✅ UI synced with state');
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
    
    console.log('  ✅ Event listeners initialized');
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
    
    // Clear container and fetch
    this.page.renderer.container.innerHTML = '';
    await this.page.fetchItems(false);
    
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
    currentProducts.forEach((product) => {
      const baseUrl = product.dataset.baseUrl || '';
      const productLinks = product.querySelectorAll(
        '.collection_image-cover, .collection_details'
      );
      const variantLinks = product.querySelectorAll('.variant-thumb-link');
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values.length > 0) {
          params.set(key, values.join(','));
        }
      });
      const currentSort = this.page.state.getCurrentSort();
      if (currentSort !== 'recommended') {
        params.set('sort', currentSort);
      }
      const queryString = params.toString();
      const productUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      productLinks.forEach((link) => {
        link.href = productUrl;
      });
      variantLinks.forEach((link) => {
        const originalHref = link.href.split('?')[0];
        link.href = queryString ? `${originalHref}?${queryString}` : originalHref;
      });
    });
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
    
    console.log(`  🖱️  Product click tracking set up for ${productLinks.length} links`);
  }
  
  _productClickHandler = (e) => {
    const gridItem = e.currentTarget.closest('.collection_grid-item');
    if (gridItem) {
      const productId = gridItem.dataset.productId || gridItem.dataset.baseUrl;
      if (productId) {
        this.page.state.setClickedProductId(productId);
        this.page.cache.save(this.page.state);
        console.log(`  💾 Saved clicked product: ${productId}`);
      }
    }
  }
  
  // ===== CLEANUP =====
  
  destroy() {
    this._ac.abort();
    console.log('  👋 CollectionInteractions destroyed');
  }
}

