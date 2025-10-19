/**
 * Collections Page - Main Coordinator
 * Ties together all modules into a cohesive system
 */

import { CollectionState } from './CollectionState.js';
import { CollectionCache } from './CollectionCache.js';
import { CollectionAPI } from './CollectionAPI.js';
import { CollectionRenderer } from './CollectionRenderer.js';
import { CollectionInfiniteScroll } from './CollectionInfiniteScroll.js';
import { CollectionInteractions } from './CollectionInteractions.js';
import { setState } from '../../core/state.js';
import { setupFilterListeners } from '../../components/filterDrawer.js';

export class CollectionsPage {
  constructor() {
    // Initialize modules
    this.state = new CollectionState();
    this.cache = new CollectionCache();
    this.api = new CollectionAPI();
    this.renderer = new CollectionRenderer('.product-grid');
    this.infiniteScroll = null;
    this.interactions = null; // Initialize after DOM is ready
    
    // Loading flag
    this.isLoading = false;
  }
  
  /**
   * Play page enter animation (reveals page immediately)
   */
  playPageEnterAnimation() {
    // 0. Reveal page immediately (hidden by CSS/transition to prevent FOUC)
    const view = document.querySelector('[data-taxi-view="collections"]');
    if (view) {
      // CRITICAL: Use vanilla JS for immediate effect (GSAP batches changes)
      view.style.opacity = '1';
      
      // Force GSAP to apply immediately
      if (window.gsap) {
        window.gsap.set(view, { opacity: 1, force3D: false });
      }
    }
    
    if (!window.gsap) return Promise.resolve();
    
    const tl = window.gsap.timeline();
    
    // 1. Heading chars: y: 100% → 0%
    const heading = document.querySelector('.font-color-primary');
    if (heading && window.SplitText) {
      const split = new window.SplitText(heading, { 
        type: 'chars',
        charsClass: 'char',
      });
      
      window.gsap.set(split.chars, { yPercent: 100 });
      
      tl.to(split.chars, {
        yPercent: 0,
        duration: 0.65,
        ease: 'expo.out',
        stagger: 0.007,
      }, 0);
    }
    
    // 2. Filter button: y: 100% → 0%
    const filterButton = document.querySelector('#filters-open');
    if (filterButton) {
      window.gsap.set(filterButton, { clearProps: 'transform' });
      window.gsap.set(filterButton, { yPercent: 100 });
      
      tl.to(filterButton, {
        yPercent: 0,
        duration: 0.65,
        ease: 'expo.out',
      }, 0.035);
    }
    
    return tl;
  }
  
  /**
   * Play page exit animation
   */
  playPageExitAnimation() {
    if (!window.gsap) return Promise.resolve();
    
    const tl = window.gsap.timeline();
    
    // 1. Heading chars: 0% → y: 100% (exit down)
    const heading = document.querySelector('.font-color-primary');
    if (heading && window.SplitText) {
      const split = new window.SplitText(heading, { 
        type: 'chars',
        charsClass: 'char',
      });
      
      tl.to(split.chars, {
        yPercent: 100,
        duration: 0.35,
        ease: 'power2.in',
        stagger: 0.005,
      }, 0);
    }
    
    // 2. Filter button: 0% → y: 100% (exit down)
    const filterButton = document.querySelector('#filters-open');
    if (filterButton) {
      tl.to(filterButton, {
        yPercent: 100,
        duration: 0.35,
        ease: 'power2.in',
      }, 0.035);
    }

    // 3. Collection Items: fade + slide down
    const items = document.querySelectorAll('.collection_grid-item');
    if (items.length > 0) {
      tl.to(items, {
        opacity: 0,
        y: 15,
        duration: 0.32,
        ease: 'power2.in',
        stagger: 0.013,
      }, 0.07);
    }
    
    return tl;
  }
  
  /**
   * Setup filter UI interactions (drawer + accordion)
   */
  setupFilterUI() {
    // Filter drawer open/close
    setupFilterListeners();
    
    // Filter accordion expand/collapse
    this.setupFilterAccordions();
    
    // Initialize interactions module (filters, sorting, image hover)
    this.interactions = new CollectionInteractions(this);
    this.interactions.init();
  }
  
  /**
   * Setup filter accordion interactions
   */
  setupFilterAccordions() {
    if (!window.gsap) return;
    
    const filterHeaders = document.querySelectorAll('.filter-header');
    
    filterHeaders.forEach((header) => {
      // Skip if already initialized
      if (header.dataset.accordionInit === 'true') return;
      
      const filterGroup = header.closest('.filter-group');
      const icon = header.querySelector('.icon-sm');
      
      if (!filterGroup || !icon) return;
      
      // Create timeline for this specific accordion (paused initially)
      const tl = window.gsap.timeline({ 
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
  
  /**
   * Initialize the page
   */
  async init(isBackButton = false) {
    // Register state IMMEDIATELY for exit animation
    setState('collections', {
      playExitAnimation: () => this.playPageExitAnimation(),
    });
    
    // Step 0: Play page enter animation (reveals page + animates elements)
    this.playPageEnterAnimation();
    
    // Step 0.5: Setup filter drawer and accordion interactions
    this.setupFilterUI();
    
    // Step 1: Load URL params into state
    this.loadURLParams();
    
    // Step 1.5: Sync UI with state (checkboxes, dropdown, chips)
    if (this.interactions) {
      this.interactions.syncUIWithState();
    }
    
    // Step 2: Try to restore from cache
    const cacheData = this.cache.restore(isBackButton);
    
    if (cacheData) {
      // Cache hit! Restore state and render
      this.state.fromJSON(cacheData);
      await this.renderer.renderItems(this.state.getItems(), true);
      this.updateUI();
      
      // Initialize interactions for restored items
      if (this.interactions) {
        this.interactions.setupProductClickTracking();
        this.interactions.initImageHover();
        this.interactions.updateProductImages();
        this.interactions.updateProductLinks();
      }
      
      // Schedule scroll restoration if back button
      if (isBackButton && this.state.clickedProductId) {
        window.__pendingScrollRestoration = this.state.clickedProductId;
      }
    } else {
      // Cache miss! Fetch fresh data
      await this.loadInitialData();
    }
    
    // Step 3: Initialize infinite scroll
    this.initInfiniteScroll();
    
    // BUG FIX: Save to cache AFTER everything is loaded
    this.cache.save(this.state);
  }
  
  /**
   * Load URL parameters into state
   */
  loadURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Load sort
    const sort = params.get('sort');
    if (sort) {
      this.state.setCurrentSort(sort);
    }
    
    // Load filters
    const filters = {};
    for (const [key, value] of params.entries()) {
      if (['sort', 'page', 'limit', 'config', 'collection_id'].includes(key)) {
        continue;
      }
      if (value) {
        filters[key] = value.split(',');
      }
    }
    
    this.state.setActiveFilters(filters);
  }
  
  /**
   * Load initial data (page 1)
   */
  async loadInitialData() {
    this.state.reset();
    await this.fetchItems();
  }
  
  /**
   * Fetch items from API
   */
  async fetchItems(append = false) {
    if (this.isLoading) return;
    this.isLoading = true;
    
    try {
      // Show skeletons
      if (!append) {
        this.renderer.showSkeletonLoaders(this.state.itemsPerPage);
      } else {
        const remaining = this.state.getTotalItems() - this.state.getItems().length;
        const count = Math.min(remaining, this.state.itemsPerPage);
        this.renderer.showSkeletonLoaders(count);
      }
      
      // Small delay for UX (prevent jarring if API is fast)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Fetch from API
      const data = await this.api.fetchItems(this.state);
      
      // Update state
      if (append) {
        this.state.appendItems(data.items);
      } else {
        this.state.setItems(data.items);
      }
      
      this.state.setTotalItems(data.pagination.total);
      // API uses camelCase: hasMore, not has_more
      this.state.setHasMorePages(data.pagination.hasMore || false);
      
      // Render
      if (append) {
        await this.renderer.appendItems(data.items);
      } else {
        await this.renderer.renderItems(data.items);
      }
      
      // Update UI
      this.updateUI();
      
      // Initialize interactions for new items (image hover, product links, click tracking)
      if (this.interactions) {
        this.interactions.setupProductClickTracking();
        this.interactions.initImageHover();
        this.interactions.updateProductImages();
        this.interactions.updateProductLinks();
      }
      
      // Increment page for next fetch
      this.state.incrementPage();
      
      // BUG FIX: Save to cache AFTER state is updated
      this.cache.save(this.state);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
        this.handleError(error);
      }
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Initialize infinite scroll
   */
  initInfiniteScroll() {
    if (this.infiniteScroll) {
      this.infiniteScroll.destroy();
    }
    
    this.infiniteScroll = new CollectionInfiniteScroll(
      '.product-grid',
      () => {
        if (this.state.hasMorePages && !this.isLoading) {
          this.fetchItems(true);
        }
      }
    );
    
    this.infiniteScroll.init();
  }
  
  /**
   * Update UI elements (results counter, etc.)
   */
  updateUI() {
    // Update results counter
    const counter = document.querySelector('[data-results-count]');
    if (counter) {
      counter.textContent = this.state.getTotalItems();
    }
    
    // Update clear button state
    const clearButton = document.querySelector('.button.alt');
    if (clearButton) {
      const hasFilters = this.state.hasFilters();
      clearButton.style.opacity = hasFilters ? '1' : '0.5';
      clearButton.disabled = !hasFilters;
    }
  }
  
  /**
   * Handle errors
   */
  handleError(error) {
    console.error('CollectionsPage error:', error);
    this.renderer.clear();
    this.renderer.container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c33;">
        <h3>Error loading products</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #c33; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
  
  /**
   * Cleanup on page leave
   */
  destroy() {
    if (this.infiniteScroll) {
      this.infiniteScroll.destroy();
    }
    
    if (this.interactions) {
      this.interactions.destroy();
    }
    
    // CRITICAL FIX: Remove filter drawer from .page-wrapper when leaving page
    // (prevents drawer staying visible/open when navigating away)
    const pageWrapper = document.querySelector('.page-wrapper');
    if (pageWrapper) {
      const drawers = pageWrapper.querySelectorAll('.filter-drawer');
      drawers.forEach(drawer => drawer.remove());
    }
    
    // Clear pending scroll restoration
    window.__pendingScrollRestoration = null;
    
    // Save one last time before leaving
    this.cache.save(this.state);
    
    // Clear state from global store
    setState('collections', null);
  }
}

// Export init function for compatibility with existing code
export async function initCollections(isBackButton = false) {
  // CRITICAL: Reveal page IMMEDIATELY before creating any modules
  // This must happen synchronously before any async operations
  const view = document.querySelector('[data-taxi-view="collections"]');
  if (view) {
    view.style.opacity = '1';
    if (window.gsap) {
      window.gsap.set(view, { opacity: 1, force3D: false });
    }
  }
  
  // Wait for fonts to load before any potential SplitText usage
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  
  const page = new CollectionsPage();
  
  // Initialize (async)
  await page.init(isBackButton);
  
  return page;
}

