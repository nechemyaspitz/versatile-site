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
        from: {
          namespace: ['collections']
        },
        to: {
          namespace: ['product']
        },
        async leave({ current }) {
          // Show clone to maintain visual continuity
          showCloneDuringTransition();
          
          // Fast fade out all items (don't wait, run parallel)
          const allItems = current.container.querySelectorAll('.collection_grid-item');
          if (window.gsap && allItems.length > 0) {
            gsap.to(allItems, {
              opacity: 0,
              duration: 0.2,
              ease: 'power2.out',
            });
          }
        },
        enter({ next }) {
          // Prepare container but keep it visible
          next.container.style.opacity = 1;
          
          // Hide slider-wrap initially (morph will reveal it)
          const sliderWrap = next.container.querySelector('.slider-wrap');
          if (sliderWrap) {
            sliderWrap.style.opacity = 0;
          }
        },
        async after({ next }) {
          // Wait for morph to complete
          await morphToProduct();
        },
      },
      {
        name: 'product-reverse-morph',
        from: {
          namespace: ['product']
        },
        to: {
          namespace: ['collections']
        },
        async leave({ current }) {
          console.log('🚀 product-reverse-morph LEAVE hook');
          // DON'T fade out - let the morph handle visibility
          // Just hide other content
          const otherContent = current.container.querySelectorAll(':scope > *:not([data-barba]):not(.slider-wrap)');
          if (window.gsap && otherContent.length > 0) {
            gsap.to(otherContent, {
              opacity: 0,
              duration: 0.2,
              ease: 'power2.out',
            });
          }
        },
        async enter({ next, trigger, current }) {
          console.log('🎯 product-reverse-morph ENTER hook', { trigger });
          
          // CRITICAL: Restore snapshot BEFORE morph runs
          // This ensures the target items exist for morphing
          if (trigger === 'back') {
            const restored = restoreCollectionsSnapshotIfPossible();
            console.log('📦 Snapshot restored:', restored);
            if (restored) {
              // Mark that we restored snapshot (so afterEnter doesn't re-init)
              next.container.dataset.snapshotRestored = 'true';
            }
          }
          
          // Keep container visible, let morph handle items
          next.container.style.opacity = 1;
          
          // CRITICAL FIX: Morph needs to happen NOW while both containers exist
          // The old container (product) is still in DOM during enter hook
          console.log('⏰ Calling morphBackToCollections in ENTER hook');
          await morphBackToCollections();
        },
        async after({ next }) {
          console.log('✅ product-reverse-morph AFTER hook');
          // Morph already completed in enter hook
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
        beforeLeave(ctx) {
          console.log('📸 Collections beforeLeave, current URL:', location.href);
          
          // CRITICAL: Only save snapshot when navigating TO product page
          // Don't save when navigating away to other pages
          if (ctx.next?.namespace === 'product') {
            saveCollectionsSnapshot();
          }
          
          getState('collections')?.destroy?.();
          clearState('collections');
        },
        async afterEnter(ctx) {
          // Check if snapshot was already restored in transition's enter hook
          const snapshotRestored = ctx.next.container.dataset.snapshotRestored === 'true';
          
          if (snapshotRestored) {
            // Snapshot was restored during transition, just reinit listeners
            console.log('✅ Skipping re-init (snapshot already restored)');
            delete ctx.next.container.dataset.snapshotRestored;
            reinitWebflow();
            initCollectionItemListeners();
            return;
          }
          
          // Try to restore from snapshot if coming back (fallback)
          if (ctx.trigger === 'back' && restoreCollectionsSnapshotIfPossible()) {
            // Snapshot restored, just reinit Webflow and bail
            reinitWebflow();
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

