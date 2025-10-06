// Page state management
const PageState = new Map();

export const setState = (ns, obj) => PageState.set(ns, obj);
export const getState = (ns) => PageState.get(ns) || {};
export const clearState = (ns) => PageState.delete(ns);

// Collections page snapshots for back/forward caching
export const pageSnapshots = new Map(); // key: href, value: { html, state, scrollY }

export function saveCollectionsSnapshot(url = null) {
  const grid = document.querySelector('.product-grid');
  
  // CRITICAL: Use provided URL or extract from container's data attribute
  // DO NOT use location.href as it may have already changed during transition
  const href = url || document.querySelector('[data-barba-namespace="collections"]')?.dataset?.barbaUrl || location.href;
  
  console.log('💾 Saving collections snapshot for:', href);
  console.log('📍 Current location.href:', location.href);
  
  if (!grid) {
    console.warn('❌ No product-grid found, cannot save snapshot');
    return;
  }
  
  const state = window.productFilter
    ? {
        activeFilters: window.productFilter.activeFilters,
        currentSort: window.productFilter.currentSort,
        currentPage: window.productFilter.currentPage,
        hasMorePages: window.productFilter.hasMorePages,
        totalItems: window.productFilter.totalItems,
      }
    : null;

  const snapshot = {
    html: grid.innerHTML,
    state,
    scrollY: window.scrollY,
  };
  
  pageSnapshots.set(href, snapshot);
  console.log('✅ Snapshot saved:', {
    url: href,
    itemCount: grid.querySelectorAll('.collection_grid-item').length,
    hasState: !!state,
  });
}

export function restoreCollectionsSnapshotIfPossible() {
  const href = location.href;
  console.log('🔍 Attempting to restore snapshot for:', href);
  console.log('📦 Available snapshots:', Array.from(pageSnapshots.keys()));
  
  const snap = pageSnapshots.get(href);
  if (!snap) {
    console.warn('❌ No snapshot found for this URL');
    return false;
  }
  
  console.log('✅ Snapshot found:', {
    hasHTML: !!snap.html,
    hasState: !!snap.state,
  });

  const grid = document.querySelector('.product-grid');
  const form = document.getElementById('filters');
  
  if (!grid) {
    console.warn('❌ No product-grid element found');
    return false;
  }
  
  if (!form) {
    console.warn('❌ No filters form found');
    return false;
  }

  // Restore the DOM
  grid.innerHTML = snap.html;
  console.log('✅ DOM restored, item count:', grid.querySelectorAll('.collection_grid-item').length);
  
  // CRITICAL FIX: Make items visible immediately (no blank screen)
  // The morph animation will handle the specific target item
  const items = grid.querySelectorAll('.w-dyn-item, .collection_grid-item');
  items.forEach(item => {
    item.style.opacity = '1';
    item.style.transform = 'none';
  });
  
  console.log('✅ Items made visible:', items.length);

  // Re-create the filter instance without fetching
  // Check if we have a reference to the filter class
  if (!window.productFilter) {
    console.warn('⚠️ No window.productFilter reference, skipping state restoration');
    return true; // Still return true since we restored the DOM
  }
  
  if (!window.InfiniteScrollProductFilter) {
    console.warn('⚠️ No window.InfiniteScrollProductFilter constructor, skipping state restoration');
    return true; // Still return true since we restored the DOM
  }
  
  const FilterClass = window.InfiniteScrollProductFilter.constructor;
  const f = Object.create(FilterClass.prototype);
  
  // Set state without initializing
  f.productContainer = grid;
  f.filterForm = form;
  f.sortDropdown = document.getElementById('sort-select');
  f.resultsCounter = document.querySelector('[data-results-count]');
  f.clearButton = document.querySelector('.button.alt');
  f.collectionId = 'c09bba8e-4a81-49c2-b722-f1fa46c75861';
  f.baseUrl = 'https://wmkcwljhyweqzjivbupx.supabase.co/functions/v1/generic-collection-filter';
  f.itemsPerPage = 30;
  f.isLoading = false;
  f.niceSelect = null;
  f._ac = new AbortController();
  f._observer = null;
  f._sentinel = null;
  f._respCache = new Map();

  // Restore state
  f.activeFilters = snap.state?.activeFilters || {};
  f.currentSort = snap.state?.currentSort || 'recommended';
  f.currentPage = snap.state?.currentPage || 1;
  f.hasMorePages = !!snap.state?.hasMorePages;
  f.totalItems = snap.state?.totalItems || 0;

  // Re-bind UI behaviors for existing DOM (these methods need to be copied)
  if (window.productFilter) {
    f.initImageHover = window.productFilter.initImageHover.bind(f);
    f.updateProductImages = window.productFilter.updateProductImages.bind(f);
    f.updateProductLinks = window.productFilter.updateProductLinks.bind(f);
    f.updateResultsCounter = window.productFilter.updateResultsCounter.bind(f);
    f.initInfiniteScroll = window.productFilter.initInfiniteScroll.bind(f);
    
    f.initImageHover();
    f.updateProductImages();
    f.updateProductLinks();
    f.updateResultsCounter(f.totalItems);
    f.initInfiniteScroll();
  }

  window.productFilter = f;
  console.log('✅ Filter state restored successfully');
  
  // Restore scroll position
  if (snap.scrollY !== undefined) {
    console.log(`📜 Restoring scroll position to ${snap.scrollY}px`);
    // Use a small delay to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      window.scrollTo(0, snap.scrollY);
      console.log('✅ Scroll position restored');
    });
  }
  
  return true;
}

