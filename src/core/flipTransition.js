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
  
  // Extract product slug from data-base-url attribute (more reliable)
  const baseUrl = gridItem.getAttribute('data-base-url');
  if (baseUrl) {
    const match = baseUrl.match(/\/collections\/([^/?]+)/);
    if (match) {
      productSlug = match[1];
      console.log('🏷️ Captured product slug:', productSlug);
    }
  }
  
  // Fallback: try to find link
  if (!productSlug) {
    const link = gridItem.querySelector('a[href*="/collections/"]');
    if (link) {
      const match = link.href.match(/\/collections\/([^/?]+)/);
      if (match) {
        productSlug = match[1];
        console.log('🏷️ Captured product slug (fallback):', productSlug);
      }
    }
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
    console.log('🎬 Forward morph: Starting');
    
    if (!clickedElementClone || !window.gsap) {
      console.warn('❌ No clone or GSAP');
      cleanup(true);
      resolve();
      return;
    }
    
    const target = document.querySelector('.slider-wrap');
    if (!target) {
      console.warn('❌ No slider-wrap found');
      cleanup(true);
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
    
    console.log('📐 Morph transform:', { scaleX, scaleY, translateX, translateY });
    
    // Position target at clone location instantly
    gsap.set(target, {
      x: translateX,
      y: translateY,
      scaleX: scaleX,
      scaleY: scaleY,
      transformOrigin: 'top left',
      opacity: 1,
      borderRadius: window.getComputedStyle(clickedElementClone).borderRadius,
    });
    
    // Create timeline for synchronized animations
    const tl = gsap.timeline({
      onComplete: () => {
        console.log('✅ Forward morph complete');
        cleanup(true); // Preserve slug for reverse morph
        resolve();
      },
    });
    
    // Fade out clone
    tl.to(clickedElementClone, {
      opacity: 0,
      duration: getDuration(0.3),
      ease: 'power2.in',
    }, 0);
    
    // Morph target to natural position
    tl.to(target, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      borderRadius: window.getComputedStyle(target).borderRadius,
      duration: getDuration(0.7),
      ease: 'power3.inOut',
      clearProps: 'transform,borderRadius',
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
      cleanup(); // Final cleanup
      resolve();
      return;
    }
    
    // Find target collection item
    const slug = getProductSlugFromURL();
    const targetItem = targetGrid.querySelector(`[data-base-url="/collections/${slug}"]`);
    
    console.log('🎯 Target item found:', !!targetItem, 'for slug:', slug);
    
    if (!targetItem) {
      console.warn('❌ No matching collection item found for reverse morph');
      console.warn('   - Available items in grid:', 
        Array.from(targetGrid.querySelectorAll('[data-base-url]'))
          .map(el => el.getAttribute('data-base-url'))
      );
      cleanup(); // Final cleanup
      resolve();
      return;
    }
    
    // Get all collection items
    const allItems = targetGrid.querySelectorAll('.collection_grid-item');
    
    console.log('🎬 Starting reverse morph animation');
    console.log('   - Total items in grid:', allItems.length);
    console.log('   - Target item found:', !!targetItem);
    
    // Force GPU layers for smooth animation
    forceGPULayer(productWrap);
    forceGPULayer(targetItem);
    
    // Get positions for morph calculation
    const productRect = productWrap.getBoundingClientRect();
    const targetRect = targetItem.getBoundingClientRect();
    
    // Calculate transform to shrink product into target item
    const scaleX = targetRect.width / productRect.width;
    const scaleY = targetRect.height / productRect.height;
    const translateX = targetRect.left - productRect.left;
    const translateY = targetRect.top - productRect.top;
    
    console.log('📐 Reverse morph metrics:', { scaleX, scaleY, translateX, translateY });
    
    // CRITICAL FIX: Don't hide all items - they're already visible!
    // Only hide the target item for the morph
    gsap.set(targetItem, { opacity: 0 });
    
    // Create timeline for coordinated animations
    const tl = gsap.timeline({
      onComplete: () => {
        console.log('✅ Reverse morph complete');
        cleanup();
        resolve();
      }
    });
    
    // 1. Morph product slider into target item position
    tl.to(productWrap, {
      x: translateX,
      y: translateY,
      scaleX: scaleX,
      scaleY: scaleY,
      transformOrigin: 'top left',
      borderRadius: window.getComputedStyle(targetItem).borderRadius,
      duration: getDuration(0.6),
      ease: 'power3.inOut',
    }, 0);
    
    // 2. Fade out product slider as it morphs
    tl.to(productWrap, {
      opacity: 0,
      duration: getDuration(0.3),
      ease: 'power2.in',
    }, getDuration(0.3));
    
    // 3. Reveal target item as product fades out
    tl.to(targetItem, {
      opacity: 1,
      duration: getDuration(0.2),
      ease: 'power2.out',
      clearProps: 'all',
    }, getDuration(0.4));
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
 * @param {boolean} preserveSlug - If true, keep productSlug for reverse morph
 */
function cleanup(preserveSlug = false) {
  if (clickedElementClone) {
    clickedElementClone.remove();
  }
  
  clickedElement = null;
  clickedElementClone = null;
  
  // Don't clear slug if we need it for reverse morph
  if (!preserveSlug) {
    productSlug = null;
  }
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
