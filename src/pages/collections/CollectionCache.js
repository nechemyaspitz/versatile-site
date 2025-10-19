/**
 * CollectionCache.js
 * Handles sessionStorage caching with URL-based keys
 * Each unique URL state gets its own cache entry
 */

export class CollectionCache {
  constructor() {
    this.cacheExpiration = 300000; // 5 minutes
  }
  
  /**
   * Generate cache key from URL or state
   * Each filter/sort combo gets a unique key
   * @param {Object} state - Optional CollectionState to generate key from
   */
  getCacheKey(state = null) {
    let params;
    
    if (state) {
      // Generate key from STATE (for saving)
      params = new URLSearchParams();
      
      // Add filters
      const activeFilters = state.getActiveFilters();
      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          params.set(key, values.join(','));
        }
      });
      
      // Add sort (if not default)
      const sort = state.getCurrentSort();
      if (sort && sort !== 'recommended') {
        params.set('sort', sort);
      }
    } else {
      // Generate key from URL (for loading)
      params = new URLSearchParams(window.location.search);
      
      // Remove pagination/config params (we cache all loaded items)
      params.delete('page');
      params.delete('limit');
      params.delete('config');
      params.delete('collection_id');
    }
    
    // Sort params alphabetically for consistent keys
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    
    return `collections_${sortedParams || 'default'}`;
  }
  
  /**
   * Save state to sessionStorage
   * BUG FIX: Generate cache key from STATE, not URL (URL might not be updated yet)
   */
  save(state) {
    try {
      const cacheKey = this.getCacheKey(state);
      const data = {
        ...state.toJSON(),
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      
      
      return true;
    } catch (error) {
      console.error('Failed to save to cache:', error);
      return false;
    }
  }
  
  /**
   * Restore state from sessionStorage
   * Returns null if no cache, expired, or invalid
   * @param {boolean} isBackButton - Whether this is a back button navigation
   * @param {Object} state - Optional state to generate key from (instead of URL)
   */
  restore(isBackButton = false, state = null) {
    try {
      const cacheKey = this.getCacheKey(state);
      
      const saved = sessionStorage.getItem(cacheKey);
      if (!saved) {
        return null;
      }
      
      const data = JSON.parse(saved);
      const now = Date.now();
      const age = now - data.timestamp;
      
      
      // Check expiration
      if (age > this.cacheExpiration) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }
      
      // Validate data
      if (!data.allLoadedItems || data.allLoadedItems.length === 0) {
        return null;
      }
      
      // Handle clicked product restoration (only for back button)
      if (!isBackButton) {
        data.clickedProductId = null;
      }
      
      
      return data;
    } catch (error) {
      console.error('Failed to restore from cache:', error);
      const cacheKey = this.getCacheKey();
      sessionStorage.removeItem(cacheKey);
      return null;
    }
  }
  
  /**
   * Clear cache for current URL state
   */
  clear() {
    const cacheKey = this.getCacheKey();
    sessionStorage.removeItem(cacheKey);
  }
  
  /**
   * Clear all collections caches
   */
  clearAll() {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('collections_')) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => sessionStorage.removeItem(key));
  }
}

