// Lenis smooth scrolling management
let lenisInstance = null;
let rafId = null;

/**
 * Initialize Lenis smooth scrolling
 */
export function initLenis() {
  // Check if Lenis is available (loaded via CDN)
  if (typeof Lenis === 'undefined') {
    console.warn('⚠️ Lenis not found! Make sure Lenis CDN script is loaded.');
    return null;
  }

  // Destroy existing instance if it exists
  if (lenisInstance) {
    destroyLenis();
  }

  // Create new Lenis instance
  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
    autoResize: true,
  });

  // Start the animation loop
  function raf(time) {
    lenisInstance.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);

  console.log('✅ Lenis smooth scrolling initialized');
  return lenisInstance;
}

/**
 * Destroy Lenis instance and stop animation loop
 */
export function destroyLenis() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
    console.log('🗑️ Lenis destroyed');
  }
}

/**
 * Stop Lenis scrolling (useful for modals, drawers, etc.)
 */
export function stopLenis() {
  if (lenisInstance) {
    lenisInstance.stop();
    console.log('⏸️ Lenis paused');
  }
}

/**
 * Resume Lenis scrolling
 */
export function startLenis() {
  if (lenisInstance) {
    lenisInstance.start();
    console.log('▶️ Lenis resumed');
  }
}

/**
 * Scroll to top (useful for page transitions)
 */
export function scrollToTop(immediate = false) {
  if (lenisInstance) {
    if (immediate) {
      lenisInstance.scrollTo(0, { immediate: true });
    } else {
      lenisInstance.scrollTo(0, { duration: 0.8 });
    }
  } else {
    // Fallback if Lenis not available
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
  }
}

/**
 * Get current Lenis instance
 */
export function getLenis() {
  return lenisInstance;
}

/**
 * Reset scroll position (for page transitions)
 */
export function resetScroll() {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: true, force: true });
  }
  window.scrollTo(0, 0);
}

