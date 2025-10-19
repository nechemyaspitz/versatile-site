/**
 * CollectionAPI.js
 * Handles all API interactions
 * No DOM, no state updates, just fetch and transform data
 */

export class CollectionAPI {
  constructor(collectionId = 'c09bba8e-4a81-49c2-b722-f1fa46c75861') {
    this.collectionId = collectionId;
    this.baseUrl = 'https://wmkcwljhyweqzjivbupx.supabase.co/functions/v1/generic-collection-filter';
    this.abortController = null;
    this.responseCache = new Map(); // API response cache (different from session cache)
    
  }
  
  /**
   * Build request URL with filters, sort, and pagination
   */
  buildRequestUrl(state) {
    const params = new URLSearchParams({
      collection_id: this.collectionId,
      page: state.getCurrentPage().toString(),
      limit: state.itemsPerPage.toString(),
      sort: state.getCurrentSort(),
    });

    // Add active filters to URL
    Object.entries(state.getActiveFilters()).forEach(
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

    // Add config
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
  
  /**
   * Fetch items from API
   * Returns { items, pagination } or throws error
   */
  async fetchItems(state) {
    const url = this.buildRequestUrl(state);
    
    
    // Check response cache
    if (this.responseCache.has(url)) {
      return this.responseCache.get(url);
    }
    
    // Cancel previous request if still pending
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    
    try {
      const response = await fetch(url, { 
        signal: this.abortController.signal 
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Please contact support.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Invalid response format from server');
      }
      
      // Cache the response
      this.responseCache.set(url, data);
      
      
      return data;
    } catch (error) {
      // Don't log abort errors (they're intentional)
      if (error.name !== 'AbortError') {
        console.error('[API] Fetch error:', error);
        throw error;
      }
      throw error;
    }
  }
  
  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.clear();
  }
}

