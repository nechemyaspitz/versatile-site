// GSAP Flip morph transition between Collections → Product
// Optimized for buttery-smooth 60fps animations

import { prepareForAnimation, cleanupAfterAnimation, deferHeavyWork, getAnimationDuration } from '../utils/performance.js';

let clickedElement = null;
let flipState = null;

// Ensure Flip plugin is registered
function ensureFlipPlugin() {
  if (!window.gsap || !window.Flip) return false;
  
  try {
    if (!gsap.plugins?.flip) {
      gsap.registerPlugin(Flip);
    }
    return true;
  } catch (e) {
    console.warn('Flip plugin not available:', e);
    return false;
  }
}

/**
 * Capture the clicked collection item for morphing
 */
export function captureClickedItem(event) {
  if (!ensureFlipPlugin()) return;
  
  const gridItem = event.target.closest('.collection_grid-item');
  if (!gridItem) return;
  
  // Store reference
  clickedElement = gridItem;
  
  // Mark for identification
  gridItem.setAttribute('data-flip-id', 'morphing-item');
  
  // Optimize for animation
  prepareForAnimation(gridItem);
  
  // Capture initial state with Flip
  try {
    flipState = Flip.getState(gridItem, {
      props: 'borderRadius,opacity',
      simple: true, // Faster state capture
    });
  } catch (e) {
    console.warn('Failed to capture Flip state:', e);
    cleanup();
  }
}

/**
 * Perform the morph animation from Collections → Product
 */
export function morphToProduct() {
  if (!ensureFlipPlugin() || !clickedElement || !flipState) return;
  
  const targetElement = document.querySelector('.slider-wrap');
  
  if (!targetElement) {
    cleanup();
    return;
  }
  
  // Optimize target for animation
  prepareForAnimation(targetElement);
  
  // Match the flip-id for Flip to work
  targetElement.setAttribute('data-flip-id', 'morphing-item');
  
  // Get animation duration (respect reduced motion preference)
  const duration = getAnimationDuration(0.6);
  
  try {
    // Perform the morph
    Flip.from(flipState, {
      duration: duration,
      ease: 'power2.inOut',
      absolute: true, // Position absolutely during animation
      scale: true,
      simple: true,
      
      // Performance: use transforms only
      onEnter: (elements) => {
        gsap.set(elements, {
          opacity: 0,
          scale: 0.95,
        });
        return gsap.to(elements, {
          opacity: 1,
          scale: 1,
          duration: getAnimationDuration(0.4),
          ease: 'power2.out',
        });
      },
      
      onComplete: () => {
        // Clean up performance hints
        cleanupAfterAnimation(targetElement);
        targetElement.removeAttribute('data-flip-id');
        cleanup();
      },
    });
  } catch (e) {
    console.warn('Flip animation failed:', e);
    // Fallback: simple fade
    gsap.to(targetElement, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
    cleanup();
  }
}

/**
 * Perform reverse morph animation from Product → Collections (back button)
 */
export function morphBackToCollections() {
  if (!ensureFlipPlugin()) return;
  
  const productWrap = document.querySelector('.slider-wrap');
  const targetGrid = document.querySelector('.product-grid');
  
  if (!productWrap || !targetGrid) return;
  
  // Find the matching collection item (same product)
  const productSlug = getProductSlugFromURL();
  const targetItem = targetGrid.querySelector(`[data-base-url="/collections/${productSlug}"]`);
  
  if (!targetItem) {
    // Fallback: just fade
    gsap.from(targetGrid, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
    return;
  }
  
  // Optimize for animation
  prepareForAnimation(productWrap);
  prepareForAnimation(targetItem);
  
  // Mark elements
  productWrap.setAttribute('data-flip-id', 'reverse-morph');
  targetItem.setAttribute('data-flip-id', 'reverse-morph');
  
  try {
    // Capture state of product page
    const productState = Flip.getState(productWrap, {
      props: 'borderRadius,opacity',
      simple: true,
    });
    
    // Get animation duration
    const duration = getAnimationDuration(0.5);
    
    // Switch to collection item visually
    requestAnimationFrame(() => {
      // Morph back
      Flip.from(productState, {
        targets: targetItem,
        duration: duration,
        ease: 'power2.inOut',
        absolute: true,
        scale: true,
        simple: true,
        
        onComplete: () => {
          cleanupAfterAnimation(productWrap);
          cleanupAfterAnimation(targetItem);
          productWrap.removeAttribute('data-flip-id');
          targetItem.removeAttribute('data-flip-id');
        },
      });
    });
  } catch (e) {
    console.warn('Reverse morph failed:', e);
    // Fallback
    gsap.from(targetGrid, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  }
}

/**
 * Get product slug from current URL
 */
function getProductSlugFromURL() {
  const path = window.location.pathname;
  const match = path.match(/\/collections\/([^/?]+)/);
  return match ? match[1] : null;
}

/**
 * Clean up references
 */
function cleanup() {
  if (clickedElement) {
    cleanupAfterAnimation(clickedElement);
    clickedElement.removeAttribute('data-flip-id');
  }
  clickedElement = null;
  flipState = null;
}

/**
 * Initialize click listeners on collection items
 */
export function initCollectionItemListeners() {
  // Remove old listeners
  document.removeEventListener('click', handleCollectionClick, true);
  
  // Add new listener (capture phase for early detection)
  document.addEventListener('click', handleCollectionClick, true);
}

function handleCollectionClick(event) {
  // Only capture if clicking on a product link in collections
  const isCollectionsPage = document.querySelector('[data-barba-namespace="collections"]');
  if (!isCollectionsPage) return;
  
  const productLink = event.target.closest('.collection_image-cover, .collection_details');
  if (!productLink) return;
  
  // Capture the clicked item
  captureClickedItem(event);
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}

