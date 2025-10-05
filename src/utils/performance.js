// Performance utilities for smooth animations

/**
 * Defer heavy work until after animations complete
 */
export function deferHeavyWork(callback, priority = 'low') {
  if (priority === 'immediate') {
    // Run on next frame
    requestAnimationFrame(callback);
  } else if (priority === 'high') {
    // Run after current frame
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  } else {
    // Run when browser is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  }
}

/**
 * Batch DOM reads to prevent layout thrashing
 */
export function batchDOMReads(reads) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const results = reads.map(fn => fn());
      resolve(results);
    });
  });
}

/**
 * Batch DOM writes to prevent layout thrashing
 */
export function batchDOMWrites(writes) {
  requestAnimationFrame(() => {
    writes.forEach(fn => fn());
  });
}

/**
 * Optimize element for animation
 */
export function prepareForAnimation(element) {
  if (!element) return;
  
  element.style.willChange = 'transform, opacity';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
}

/**
 * Clean up animation optimizations
 */
export function cleanupAfterAnimation(element) {
  if (!element) return;
  
  // Defer cleanup to avoid forced reflow
  requestAnimationFrame(() => {
    element.style.willChange = 'auto';
    element.style.backfaceVisibility = '';
    element.style.perspective = '';
  });
}

/**
 * Throttle function to limit execution rate
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function to delay execution
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get safe animation duration (0 if reduced motion preferred)
 */
export function getAnimationDuration(defaultDuration) {
  return prefersReducedMotion() ? 0 : defaultDuration;
}

