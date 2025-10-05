// Lazy loading utility for collection items
// Only processes items as they enter viewport

let observer = null;

/**
 * Initialize Intersection Observer for lazy operations
 */
export function initLazyLoader(callback, options = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.01,
  } = options;
  
  if (observer) {
    observer.disconnect();
  }
  
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.processed) {
        entry.target.dataset.processed = 'true';
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin,
    threshold,
  });
  
  return observer;
}

/**
 * Observe elements for lazy loading
 */
export function observeElements(elements) {
  if (!observer) return;
  
  elements.forEach(el => {
    if (el && !el.dataset.processed) {
      observer.observe(el);
    }
  });
}

/**
 * Cleanup observer
 */
export function cleanupLazyLoader() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

