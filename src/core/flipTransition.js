// GSAP Flip morph transition between Collections → Product
// Optimized for buttery-smooth 60fps animations

import { prepareForAnimation, cleanupAfterAnimation, deferHeavyWork, getAnimationDuration } from '../utils/performance.js';

let clickedElement = null;
let clickedElementClone = null;
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
 * Creates a clone that survives page transitions
 */
export function captureClickedItem(event) {
  if (!ensureFlipPlugin()) return;
  
  const gridItem = event.target.closest('.collection_grid-item');
  if (!gridItem) return;
  
  // Store reference
  clickedElement = gridItem;
  
  // Get the position before we do anything
  const rect = gridItem.getBoundingClientRect();
  
  // Clone the element to keep it visible during transition
  clickedElementClone = gridItem.cloneNode(true);
  clickedElementClone.style.position = 'fixed';
  clickedElementClone.style.top = rect.top + 'px';
  clickedElementClone.style.left = rect.left + 'px';
  clickedElementClone.style.width = rect.width + 'px';
  clickedElementClone.style.height = rect.height + 'px';
  clickedElementClone.style.margin = '0';
  clickedElementClone.style.zIndex = '9999';
  clickedElementClone.style.pointerEvents = 'none';
  clickedElementClone.setAttribute('data-flip-clone', 'true');
  
  // Optimize for animation
  prepareForAnimation(clickedElementClone);
  
  // Don't append yet - will append in leave hook
  
  // Store the rect for later use
  flipState = {
    rect: rect,
    borderRadius: window.getComputedStyle(gridItem).borderRadius,
  };
}

/**
 * Append the clone to body (called in leave hook)
 */
export function showCloneDuringTransition() {
  if (clickedElementClone) {
    document.body.appendChild(clickedElementClone);
  }
}

/**
 * Perform the morph animation from Collections → Product
 */
export function morphToProduct() {
  if (!ensureFlipPlugin() || !flipState || !clickedElementClone) {
    cleanup();
    return;
  }
  
  const targetElement = document.querySelector('.slider-wrap');
  
  if (!targetElement) {
    cleanup();
    return;
  }
  
  // Optimize for animation
  prepareForAnimation(targetElement);
  
  // Get animation duration (respect reduced motion preference)
  const duration = getAnimationDuration(0.8);
  
  try {
    // Get target's natural position
    const targetRect = targetElement.getBoundingClientRect();
    const cloneRect = clickedElementClone.getBoundingClientRect();
    
    // Calculate transform needed to move from clone position to target position
    const scaleX = cloneRect.width / targetRect.width;
    const scaleY = cloneRect.height / targetRect.height;
    const translateX = cloneRect.left - targetRect.left;
    const translateY = cloneRect.top - targetRect.top;
    
    // Position target at clone's position initially
    gsap.set(targetElement, {
      x: translateX,
      y: translateY,
      scaleX: scaleX,
      scaleY: scaleY,
      transformOrigin: 'top left',
      opacity: 1,
      borderRadius: flipState.borderRadius,
    });
    
    // Start fading out clone
    gsap.to(clickedElementClone, {
      opacity: 0,
      duration: duration * 0.3,
      ease: 'power2.in',
    });
    
    // Animate target to its natural position
    gsap.to(targetElement, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      borderRadius: window.getComputedStyle(targetElement).borderRadius,
      duration: duration,
      ease: 'power3.inOut',
      clearProps: 'transform,borderRadius',
      
      onComplete: () => {
        cleanupAfterAnimation(targetElement);
        cleanup();
      },
    });
    
  } catch (e) {
    console.warn('Flip animation failed:', e);
    // Fallback: simple fade
    gsap.set(clickedElementClone, { opacity: 0 });
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
        
        // Fade in other collection items smoothly
        const otherItems = targetGrid.querySelectorAll('.collection_grid-item');
        // Check if items are already visible (from snapshot restore)
        const areItemsVisible = Array.from(otherItems).some(item => 
          parseFloat(window.getComputedStyle(item).opacity) > 0.5
        );
        
        if (!areItemsVisible) {
          gsap.fromTo(otherItems,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: {
                amount: 0.2,
                from: 'start',
              },
              ease: 'power2.out',
              clearProps: 'transform',
            }
          );
        }
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
  if (clickedElementClone) {
    clickedElementClone.remove();
    cleanupAfterAnimation(clickedElementClone);
  }
  clickedElement = null;
  clickedElementClone = null;
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

