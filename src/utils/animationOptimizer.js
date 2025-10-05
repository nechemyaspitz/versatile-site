// Ultra-optimized animation utilities for 60fps animations
// All animations use GPU-accelerated properties and requestAnimationFrame

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Force GPU layer creation for smoother animations
 */
export function forceGPULayer(element) {
  if (!element) return;
  
  gsap.set(element, {
    force3D: true,
    z: 0.01,
    backfaceVisibility: 'hidden',
    perspective: 1000,
  });
}

/**
 * Batch DOM reads to avoid layout thrashing
 */
export function batchGetBounds(elements) {
  const bounds = [];
  
  // Batch all reads
  requestAnimationFrame(() => {
    elements.forEach(el => {
      if (el && el.getBoundingClientRect) {
        bounds.push({
          element: el,
          rect: el.getBoundingClientRect(),
          computed: window.getComputedStyle(el),
        });
      }
    });
  });
  
  return bounds;
}

/**
 * Get optimized animation duration
 */
export function getDuration(base) {
  return prefersReducedMotion ? 0.01 : base;
}

/**
 * Optimized stagger animation for lists
 * CLEANED UP: No double GPU layer forcing
 */
export function staggerFadeIn(elements, options = {}) {
  if (!window.gsap || !elements || elements.length === 0) return;
  
  const {
    duration = 0.5,
    stagger = 0.3,
    y = 10,
    ease = 'power2.out',
    clearProps = true,
  } = options;
  
  // Kill any existing animations
  gsap.killTweensOf(elements);
  
  return gsap.to(elements, {
    opacity: 1,
    y: 0,
    duration: getDuration(duration),
    ease: ease,
    stagger: {
      amount: getDuration(stagger),
      from: 'start',
    },
    force3D: true, // GPU acceleration built-in
    clearProps: clearProps ? 'transform' : '',
  });
}

/**
 * Kill all animations on elements
 */
export function killAllAnimations(elements) {
  if (!window.gsap) return;
  
  if (Array.isArray(elements) || elements instanceof NodeList) {
    gsap.killTweensOf(elements);
  } else {
    gsap.killTweensOf(elements);
  }
}

/**
 * Optimized fade out
 */
export function fadeOut(elements, duration = 0.3) {
  if (!window.gsap) return Promise.resolve();
  
  return gsap.to(elements, {
    opacity: 0,
    duration: getDuration(duration),
    ease: 'power2.out',
  });
}

/**
 * Optimized fade in
 */
export function fadeIn(elements, duration = 0.3) {
  if (!window.gsap) return Promise.resolve();
  
  return gsap.fromTo(elements,
    { opacity: 0 },
    {
      opacity: 1,
      duration: getDuration(duration),
      ease: 'power2.out',
    }
  );
}

/**
 * Morph element A to position/size of element B
 */
export function morphElement(from, to, options = {}) {
  if (!from || !to || !window.gsap) return Promise.resolve();
  
  const {
    duration = 0.7,
    ease = 'power3.inOut',
    onComplete = null,
  } = options;
  
  // Force GPU layers
  forceGPULayer(from);
  forceGPULayer(to);
  
  // Get positions
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  
  // Calculate transform
  const scaleX = fromRect.width / toRect.width;
  const scaleY = fromRect.height / toRect.height;
  const translateX = fromRect.left - toRect.left;
  const translateY = fromRect.top - toRect.top;
  
  // Set initial state
  gsap.set(to, {
    x: translateX,
    y: translateY,
    scaleX: scaleX,
    scaleY: scaleY,
    transformOrigin: 'top left',
    opacity: 1,
    borderRadius: window.getComputedStyle(from).borderRadius,
  });
  
  // Animate to natural position
  return gsap.to(to, {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    borderRadius: window.getComputedStyle(to).borderRadius,
    duration: getDuration(duration),
    ease: ease,
    clearProps: 'transform,borderRadius',
    onComplete: onComplete,
  });
}

/**
 * Check if element is visible
 */
export function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return parseFloat(style.opacity) > 0.1 && style.display !== 'none';
}

/**
 * Defer non-critical work to idle time
 */
export function deferToIdle(callback) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 1000 });
  } else {
    setTimeout(() => requestAnimationFrame(callback), 100);
  }
}

