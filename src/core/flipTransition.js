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
  
  // Optimize both elements for animation
  prepareForAnimation(clickedElement);
  prepareForAnimation(targetElement);
  
  // Get animation duration (respect reduced motion preference)
  const duration = getAnimationDuration(0.7);
  
  try {
    // Get the current state of the target (where we're going)
    const endState = Flip.getState(targetElement, {
      props: 'borderRadius,opacity',
      simple: true,
    });
    
    // Make target look like the clicked item (START position)
    // This is the key: position target at the START, then animate to END
    const clickedRect = clickedElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Calculate transform needed to place target at clicked position
    const scaleX = clickedRect.width / targetRect.width;
    const scaleY = clickedRect.height / targetRect.height;
    const translateX = clickedRect.left - targetRect.left;
    const translateY = clickedRect.top - targetRect.top;
    
    // Set target to clicked item's position/size instantly
    gsap.set(targetElement, {
      x: translateX,
      y: translateY,
      scaleX: scaleX,
      scaleY: scaleY,
      transformOrigin: 'top left',
      opacity: 1,
      borderRadius: window.getComputedStyle(clickedElement).borderRadius,
    });
    
    // Hide clicked item now that target is in its place
    gsap.set(clickedElement, { opacity: 0 });
    
    // Animate target from clicked position to its natural position
    gsap.to(targetElement, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      borderRadius: window.getComputedStyle(targetElement).borderRadius,
      duration: duration,
      ease: 'power3.inOut',
      clearProps: 'transform,borderRadius', // Clean up after animation
      
      onComplete: () => {
        // Clean up performance hints
        cleanupAfterAnimation(targetElement);
        cleanupAfterAnimation(clickedElement);
        cleanup();
      },
    });
    
    // Fade in other content of the product page during morph
    const otherContent = document.querySelectorAll('.slider-wrap > *:not(.f-carousel)');
    if (otherContent.length > 0) {
      gsap.fromTo(otherContent, 
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: duration * 0.6,
          delay: duration * 0.4,
          ease: 'power2.out',
        }
      );
    }
    
  } catch (e) {
    console.warn('Flip animation failed:', e);
    // Fallback: simple fade
    gsap.set(clickedElement, { opacity: 0 });
    gsap.fromTo(targetElement, 
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      }
    );
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
  
  // Get animation duration
  const duration = getAnimationDuration(0.7);
  
  try {
    // Get positions for the morph
    const productRect = productWrap.getBoundingClientRect();
    const targetRect = targetItem.getBoundingClientRect();
    
    // Calculate transform to shrink product into target position
    const scaleX = targetRect.width / productRect.width;
    const scaleY = targetRect.height / productRect.height;
    const translateX = targetRect.left - productRect.left;
    const translateY = targetRect.top - productRect.top;
    
    // Hide target item (we'll morph product into its place)
    gsap.set(targetItem, { opacity: 0 });
    
    // Animate product wrap to target item position
    gsap.to(productWrap, {
      x: translateX,
      y: translateY,
      scaleX: scaleX,
      scaleY: scaleY,
      transformOrigin: 'top left',
      borderRadius: window.getComputedStyle(targetItem).borderRadius,
      duration: duration,
      ease: 'power3.inOut',
      
      onComplete: () => {
        // Show target item, hide product
        gsap.set(targetItem, { opacity: 1 });
        gsap.set(productWrap, { opacity: 0 });
        
        // Clean up
        cleanupAfterAnimation(productWrap);
        cleanupAfterAnimation(targetItem);
        
        // Fade in other collection items
        const otherItems = targetGrid.querySelectorAll('.collection_grid-item');
        gsap.from(otherItems, {
          opacity: 0,
          duration: 0.3,
          stagger: 0.02,
          ease: 'power2.out',
        });
      },
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

