// Page state management
const PageState = new Map();

export const setState = (ns, obj) => PageState.set(ns, obj);
export const getState = (ns) => PageState.get(ns) || {};
export const clearState = (ns) => PageState.delete(ns);

// Collections page snapshots for back/forward caching
export const pageSnapshots = new Map(); // key: href, value: { html, state, scrollY }

export function saveCollectionsSnapshot() {
  const grid = document.querySelector('.product-grid');
  const href = location.href;
  if (!grid) return;
  const state = window.productFilter
    ? {
        activeFilters: window.productFilter.activeFilters,
        currentSort: window.productFilter.currentSort,
        currentPage: window.productFilter.currentPage,
        hasMorePages: window.productFilter.hasMorePages,
        totalItems: window.productFilter.totalItems,
      }
    : null;

  pageSnapshots.set(href, {
    html: grid.innerHTML,
    state,
    scrollY: window.scrollY,
  });
}

export function restoreCollectionsSnapshotIfPossible() {
  const href = location.href;
  const snap = pageSnapshots.get(href);
  if (!snap) return false;

  const grid = document.querySelector('.product-grid');
  const form = document.getElementById('filters');
  if (!grid || !form) return false;

  // Restore the DOM
  grid.innerHTML = snap.html;

  // Re-create the filter instance without fetching
  // Import is handled at runtime, so we'll check window global
  if (!window.InfiniteScrollProductFilter) return false;
  
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
  return true;
}

