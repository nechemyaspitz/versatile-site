/**
 * CollectionState.js
 * Pure state management for collections page
 * No DOM, no API, just state
 */

export class CollectionState {
  constructor() {
    // Items
    this.allLoadedItems = [];
    this.totalItems = 0;
    
    // Filters
    this.activeFilters = {};
    this.currentSort = 'recommended';
    
    // Pagination
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.hasMorePages = true;
    
    // Scroll restoration
    this.clickedProductId = null;
    
    console.log('📊 CollectionState initialized');
  }
  
  // ===== GETTERS =====
  
  getItems() {
    return this.allLoadedItems;
  }
  
  getTotalItems() {
    return this.totalItems;
  }
  
  getActiveFilters() {
    return this.activeFilters;
  }
  
  getCurrentSort() {
    return this.currentSort;
  }
  
  getCurrentPage() {
    return this.currentPage;
  }
  
  hasFilters() {
    return Object.values(this.activeFilters).some(
      filterValues => Array.isArray(filterValues) && filterValues.length > 0
    );
  }
  
  // ===== SETTERS =====
  
  setItems(items) {
    this.allLoadedItems = [...items];
    console.log(`  📊 State: Set items to ${this.allLoadedItems.length}`);
  }
  
  appendItems(items) {
    this.allLoadedItems.push(...items);
    console.log(`  📊 State: Appended ${items.length} items, total now ${this.allLoadedItems.length}`);
  }
  
  setTotalItems(total) {
    this.totalItems = total;
  }
  
  setActiveFilters(filters) {
    this.activeFilters = { ...filters };
    console.log(`  📊 State: Filters updated:`, JSON.stringify(this.activeFilters));
  }
  
  setCurrentSort(sort) {
    this.currentSort = sort;
    console.log(`  📊 State: Sort updated: ${sort}`);
  }
  
  setCurrentPage(page) {
    this.currentPage = page;
  }
  
  incrementPage() {
    this.currentPage++;
  }
  
  setHasMorePages(hasMore) {
    this.hasMorePages = hasMore;
  }
  
  setClickedProductId(id) {
    this.clickedProductId = id;
  }
  
  // ===== RESET =====
  
  reset() {
    this.allLoadedItems = [];
    this.currentPage = 1;
    this.hasMorePages = true;
    console.log('  📊 State: Reset to initial state');
  }
  
  // ===== SERIALIZATION =====
  
  toJSON() {
    return {
      allLoadedItems: this.allLoadedItems,
      totalItems: this.totalItems,
      activeFilters: this.activeFilters,
      currentSort: this.currentSort,
      currentPage: this.currentPage,
      hasMorePages: this.hasMorePages,
      clickedProductId: this.clickedProductId,
    };
  }
  
  fromJSON(data) {
    if (!data) return;
    
    this.allLoadedItems = data.allLoadedItems || [];
    this.totalItems = data.totalItems || 0;
    this.activeFilters = data.activeFilters || {};
    this.currentSort = data.currentSort || 'recommended';
    this.currentPage = data.currentPage || 1;
    this.hasMorePages = data.hasMorePages !== undefined ? data.hasMorePages : true;
    this.clickedProductId = data.clickedProductId || null;
    
    console.log(`  📊 State: Restored from JSON - ${this.allLoadedItems.length} items`);
  }
}

