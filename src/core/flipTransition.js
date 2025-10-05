// Ultra-optimized morph animations between Collections ↔ Product
// Rewritten for 60fps performance with zero jank

import { forceGPULayer, getDuration, killAllAnimations, isVisible, fadeOut } from '../utils/animationOptimizer.js';

let clickedElement = null;
let clickedElementClone = null;
let productSlug = null;

/**
 * Capture clicked item and create overlay clone
 */
export function captureClickedItem(event) {
  const gridItem = event.target.closest('.collection_grid-item');
  if (!gridItem || !window.gsap) return;
  
  // Store reference
  clickedElement = gridItem;
  
  // Extract product slug from URL
  const link = gridItem.querySelector('a[href*="/collections/"]');
  if (link) {
    const match = link.href.match(/\/collections\/([^/?]+)/);
    if (match) productSlug = match[1];
  }
  
  // Get position BEFORE any DOM changes
  const rect = gridItem.getBoundingClientRect();
  const computed = window.getComputedStyle(gridItem);
  
  // Create clone
  clickedElementClone = gridItem.cloneNode(true);
  clickedElementClone.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    margin: 0;
    z-index: 10000;
    pointer-events: none;
    border-radius: ${computed.borderRadius};
  `;
  clickedElementClone.setAttribute('data-flip-clone', 'true');
  
  // Force GPU layer
  forceGPULayer(clickedElementClone);
}

/**
 * Show clone during page transition
 */
export function showCloneDuringTransition() {
  if (clickedElementClone && !document.body.contains(clickedElementClone)) {
    document.body.appendChild(clickedElementClone);
  }
}

/**
 * Morph from clicked item to product page
 */
export function morphToProduct() {
  return new Promise((resolve) => {
    if (!clickedElementClone || !window.gsap) {
      cleanup();
      resolve();
      return;
    }
    
    const target = document.querySelector('.slider-wrap');
    if (!target) {
      cleanup();
      resolve();
      return;
    }
    
    // Force GPU layer on target
    forceGPULayer(target);
    
    // Get positions
    const cloneRect = clickedElementClone.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    
    // Calculate transform to position target at clone
    const scaleX = cloneRect.width / targetRect.width;
    const scaleY = cloneRect.height / targetRect.height;
    const translateX = cloneRect.left - targetRect.left;
    const translateY = cloneRect.top - targetRect.top;
    
    // Position target at clone location instantly
    gsap.set(target, {
      x: translateX,
      y: translateY,
      scaleX: scaleX,
      scaleY: scaleY,
      transformOrigin: 'top left',
      opacity: 1,
    });
    
    // Create timeline for synchronized animations
    const tl = gsap.timeline({
      onComplete: () => {
        cleanup();
        resolve();
      },
    });
    
    // Fade out clone
    tl.to(clickedElementClone, {
      opacity: 0,
      duration: getDuration(0.25),
      ease: 'power2.in',
    }, 0);
    
    // Morph target to natural position
    tl.to(target, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: getDuration(0.8),
      ease: 'power3.inOut',
      clearProps: 'transform',
    }, 0);
  });
}

/**
 * Morph from product page back to collection item
 */
export function morphBackToCollections() {
  return new Promise((resolve) => {
    console.log('🔄 morphBackToCollections() called');
    
    if (!window.gsap) {
      console.warn('❌ GSAP not available');
      resolve();
      return;
    }
    
    const productWrap = document.querySelector('.slider-wrap');
    const targetGrid = document.querySelector('.product-grid');
    
    console.log('🔍 Elements:', {
      productWrap: !!productWrap,
      targetGrid: !!targetGrid,
      productSlug: productSlug,
    });
    
    if (!productWrap || !targetGrid) {
      console.warn('❌ Missing elements for reverse morph');
      resolve();
      return;
    }
    
    // Find target collection item
    const slug = getProductSlugFromURL();
    const targetItem = targetGrid.querySelector(`[data-base-url="/collections/${slug}"]`);
    
    console.log('🎯 Target item found:', !!targetItem, 'for slug:', slug);
    
    if (!targetItem) {
      console.warn('❌ No matching collection item found for reverse morph');
      resolve();
      return;
    }
    
    // Check if items are from snapshot (already visible)
    const allItems = targetGrid.querySelectorAll('.collection_grid-item');
    const itemsAlreadyVisible = Array.from(allItems).some(item => isVisible(item));
    
    // Force GPU layers
    forceGPULayer(productWrap);
    forceGPULayer(targetItem);
    
    // Get positions
    const productRect = productWrap.getBoundingClientRect();
    const targetRect = targetItem.getBoundingClientRect();
    
    // Calculate transform
    const scaleX = targetRect.width / productRect.width;
    const scaleY = targetRect.height / productRect.height;
    const translateX = targetRect.left - productRect.left;
    const translateY = targetRect.top - productRect.top;
    
    // Hide target during morph
    gsap.set(targetItem, { opacity: 0 });
    
    // If items are already visible, hide them temporarily
    if (itemsAlreadyVisible) {
      gsap.set(allItems, { opacity: 0 });
    }
    
    // Morph product wrap to target position
    gsap.to(productWrap, {
      x: translateX,
      y: translateY,
      scaleX: scaleX,
      scaleY: scaleY,
      transformOrigin: 'top left',
      duration: getDuration(0.7),
      ease: 'power3.inOut',
      
      onComplete: () => {
        // Show target item
        gsap.set(targetItem, { opacity: 1, clearProps: 'all' });
        
        // Fade in other items
        if (!itemsAlreadyVisible) {
          // Fresh load - stagger them in
          gsap.fromTo(allItems,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: getDuration(0.4),
              stagger: {
                amount: getDuration(0.2),
                from: 'start',
              },
              ease: 'power2.out',
              clearProps: 'transform',
            }
          );
        } else {
          // Snapshot restore - just show them
          gsap.to(allItems, {
            opacity: 1,
            duration: getDuration(0.3),
            ease: 'power2.out',
            clearProps: 'all',
          });
        }
        
        resolve();
      },
    });
  });
}

/**
 * Get product slug from current URL
 */
function getProductSlugFromURL() {
  if (productSlug) return productSlug;
  
  const path = window.location.pathname;
  const match = path.match(/\/collections\/([^/?]+)/);
  return match ? match[1] : null;
}

/**
 * Clean up all references and DOM elements
 */
function cleanup() {
  if (clickedElementClone) {
    clickedElementClone.remove();
  }
  
  clickedElement = null;
  clickedElementClone = null;
  productSlug = null;
}

/**
 * Initialize click listeners
 */
export function initCollectionItemListeners() {
  document.removeEventListener('click', handleCollectionClick, true);
  document.addEventListener('click', handleCollectionClick, true);
}

function handleCollectionClick(event) {
  const isCollectionsPage = document.querySelector('[data-barba-namespace="collections"]');
  if (!isCollectionsPage) return;
  
  const productLink = event.target.closest('.collection_image-cover, .collection_details');
  if (!productLink) return;
  
  captureClickedItem(event);
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
