/**
 * Collections Page - Main Coordinator
 * Ties together all modules into a cohesive system
 */

import { CollectionState } from './CollectionState.js';
import { CollectionCache } from './CollectionCache.js';
import { CollectionAPI } from './CollectionAPI.js';
import { CollectionRenderer } from './CollectionRenderer.js';
import { CollectionInfiniteScroll } from './CollectionInfiniteScroll.js';

export class CollectionsPage {
  constructor() {
    // Initialize modules
    this.state = new CollectionState();
    this.cache = new CollectionCache();
    this.api = new CollectionAPI();
    this.renderer = new CollectionRenderer('.product-grid');
    this.infiniteScroll = null;
    
    // Loading flag
    this.isLoading = false;
    
    console.log('🎬 CollectionsPage initialized');
  }
  
  /**
   * Initialize the page
   */
  async init(isBackButton = false) {
    console.log('%c========== COLLECTIONS INIT ==========', 'color: #00ff00; font-weight: bold');
    console.log(`URL: ${window.location.href}`);
    console.log(`Back button: ${isBackButton}`);
    
    // Step 0: Reveal page immediately (hidden by CSS to prevent FOUC)
    const view = document.querySelector('[data-taxi-view="collections"]');
    if (view) {
      if (window.gsap) {
        window.gsap.set(view, { opacity: 1 });
      } else {
        // Fallback if GSAP not loaded yet
        view.style.opacity = '1';
      }
      console.log('  👁️  Page revealed');
    }
    
    // Step 1: Load URL params into state
    this.loadURLParams();
    
    // Step 2: Try to restore from cache
    const cacheData = this.cache.restore(isBackButton);
    
    if (cacheData) {
      // Cache hit! Restore state and render
      this.state.fromJSON(cacheData);
      await this.renderer.renderItems(this.state.getItems(), true);
      this.updateUI();
      
      // Schedule scroll restoration if back button
      if (isBackButton && this.state.clickedProductId) {
        window.__pendingScrollRestoration = this.state.clickedProductId;
      }
      
      console.log(`✅ Restored from cache: ${this.state.getItems().length}/${this.state.getTotalItems()} items`);
    } else {
      // Cache miss! Fetch fresh data
      console.log('  📡 No cache - fetching fresh data');
      await this.loadInitialData();
    }
    
    // Step 3: Initialize infinite scroll
    this.initInfiniteScroll();
    
    // BUG FIX: Save to cache AFTER everything is loaded
    this.cache.save(this.state);
    
    console.log('%c========== INIT COMPLETE ==========', 'color: #00ff00; font-weight: bold');
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
    
    console.log('  📄 Loaded from URL:', {
      sort: this.state.getCurrentSort(),
      filters: this.state.getActiveFilters()
    });
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
      this.state.setHasMorePages(data.pagination.has_more);
      
      // Render
      if (append) {
        await this.renderer.appendItems(data.items);
      } else {
        await this.renderer.renderItems(data.items);
      }
      
      // Update UI
      this.updateUI();
      
      // Increment page for next fetch
      this.state.incrementPage();
      
      // BUG FIX: Save to cache AFTER state is updated
      this.cache.save(this.state);
      
      console.log(`✅ Fetch complete: ${this.state.getItems().length}/${this.state.getTotalItems()} items loaded`);
      
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
    
    // Save one last time before leaving
    this.cache.save(this.state);
    
    console.log('  👋 CollectionsPage destroyed');
  }
}

// Export init function for compatibility with existing code
export async function initCollections(isBackButton = false) {
  const page = new CollectionsPage();
  await page.init(isBackButton);
  return page;
}

