// Barba.js SPA manager with performance optimizations
import { initHome } from '../pages/home.js';
import { initCollections } from '../pages/collections.js';
import { initProduct } from '../pages/product.js';
import { getState, clearState, saveCollectionsSnapshot, restoreCollectionsSnapshotIfPossible } from './state.js';
import { closeNav, updateActiveNavLinks, initScalingHamburgerNavigation } from '../components/navigation.js';
import { initButtonCharacterStagger } from '../components/buttonStagger.js';
import { reinitWebflow } from '../utils/webflow.js';
import { initCollectionItemListeners, morphToProduct, morphBackToCollections, showCloneDuringTransition } from './flipTransition.js';

export function initBarba() {
  // Initialize persistent navigation
  initScalingHamburgerNavigation();
  updateActiveNavLinks();

  if (!window.barba || !barba.init) {
    console.error('Barba not found. Include @barba/core before this script.');
    return;
  }

  // Enable prefetch plugin if available
  if (window.barbaPrefetch) {
    barba.use(barbaPrefetch);
  }

  // Disable native scroll restoration so Barba can handle it
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  barba.init({
    prevent: ({ el }) => el?.hasAttribute?.('data-no-barba'),
    transitions: [
      {
        name: 'product-morph',
        // Apply to collections → product transitions
        from: {
          namespace: ['collections']
        },
        to: {
          namespace: ['product']
        },
        leave({ current }) {
          // Show the clone overlay to keep clicked item visible
          showCloneDuringTransition();
          
          // Fade out all items including the clicked one
          const allItems = current.container.querySelectorAll('.collection_grid-item');
          if (window.gsap && allItems.length > 0) {
            return gsap.to(allItems, {
              opacity: 0,
              duration: 0.25,
              ease: 'power2.out',
              stagger: 0.015,
            });
          }
        },
        enter({ next }) {
          // Hide the new container initially
          if (window.gsap) {
            next.container.style.opacity = 1;
            // Hide only the slider-wrap, show other content
            const sliderWrap = next.container.querySelector('.slider-wrap');
            if (sliderWrap) {
              sliderWrap.style.opacity = 0;
            }
          }
        },
        after({ next }) {
          // Perform the morph animation
          morphToProduct();
          
          // Fade in other page content
          const otherContent = next.container.querySelectorAll(':scope > *:not([data-barba])');
          if (window.gsap && otherContent.length > 0) {
            gsap.fromTo(otherContent,
              { opacity: 0 },
              { 
                opacity: 1, 
                duration: 0.4,
                delay: 0.2,
                ease: 'power2.out',
              }
            );
          }
        },
      },
      {
        name: 'product-reverse-morph',
        // Apply to product → collections (back button)
        from: {
          namespace: ['product']
        },
        to: {
          namespace: ['collections']
        },
        leave({ current }) {
          // Fade out product page
          if (window.gsap) {
            return gsap.to(current.container, {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.out',
            });
          }
        },
        enter({ next }) {
          if (window.gsap) {
            next.container.style.opacity = 0;
          }
        },
        after({ next }) {
          // Perform reverse morph if going back
          morphBackToCollections();
          
          // Fade in container
          if (window.gsap) {
            gsap.to(next.container, {
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out',
            });
          }
        },
      },
      {
        name: 'fade',
        // Default transition for all other page combinations
        leave({ current }) {
          if (window.gsap) {
            return gsap.to(current.container, {
              opacity: 0,
              duration: 0.2,
              ease: 'power1.out',
            });
          }
        },
        enter({ next }) {
          if (window.gsap) {
            next.container.style.opacity = 0;
            return gsap.to(next.container, {
              opacity: 1,
              duration: 0.2,
              ease: 'power1.out',
            });
          }
        },
      },
    ],
    views: [
      {
        namespace: 'home',
        beforeLeave() {
          getState('home')?.destroy?.();
          clearState('home');
        },
        async afterEnter() {
          await initHome();
        },
      },
      {
        namespace: 'collections',
        beforeLeave() {
          // Save snapshot before destroying
          saveCollectionsSnapshot();
          getState('collections')?.destroy?.();
          clearState('collections');
        },
        async afterEnter(ctx) {
          // Try to restore from snapshot if coming back
          if (ctx.trigger === 'back' && restoreCollectionsSnapshotIfPossible()) {
            // Snapshot restored, just reinit Webflow and bail
            reinitWebflow();
            // Re-initialize click listeners for Flip
            initCollectionItemListeners();
            return;
          }
          // Fresh entry: normal init (will fetch)
          await initCollections();
          // Initialize click listeners for Flip morphing
          initCollectionItemListeners();
        },
      },
      {
        namespace: 'product',
        beforeLeave() {
          getState('product')?.destroy?.();
          clearState('product');
        },
        async afterEnter() {
          await initProduct();
        },
      },
    ],
  });

  // Close nav at start of any transition
  barba.hooks.before(() => {
    closeNav();
  });

  // After each transition: smart scroll restoration
  barba.hooks.after((ctx) => {
    // Back/forward navigation: restore scroll position
    if (ctx.trigger === 'back' || ctx.trigger === 'forward') {
      const y = barba.history.current?.scroll?.y ?? 0;
      window.scrollTo(0, y);
    } else {
      // Normal click: go to top
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  });

  // After each enter: update active nav, re-init Webflow, generic UI init
  barba.hooks.afterEnter((ctx) => {
    const path = ctx?.next?.url?.path || location.pathname;
    updateActiveNavLinks(path);
    reinitWebflow();
    initButtonCharacterStagger();
  });

  // First load: initialize current page
  initButtonCharacterStagger();
  reinitWebflow();

  const firstNs = document
    .querySelector('[data-barba="container"]')
    ?.getAttribute('data-barba-namespace');

  if (firstNs === 'home') {
    initHome();
  } else if (firstNs === 'collections') {
    initCollections();
  } else if (firstNs === 'product') {
    initProduct();
  }
}

