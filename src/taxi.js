// Taxi.js initialization - MUCH simpler than Barba!
import { reinitWebflow } from './utils/webflow.js';
import { closeNav, updateActiveNavLinks, initScalingHamburgerNavigation } from './components/navigation.js';
import { saveCollectionsSnapshot } from './core/state.js';

// Import renderer factories
import createDefaultRenderer from './renderers/DefaultRenderer.js';
import createHomeRenderer from './renderers/HomeRenderer.js';
import createCollectionsRenderer from './renderers/CollectionsRenderer.js';
import createProductRenderer from './renderers/ProductRenderer.js';

// Import transition factories
import createDefaultTransition from './transitions/DefaultTransition.js';

export function initTaxi() {
  console.log('🚕 Taxi.js initializing...');
  
  // Check if taxi is available (loaded via CDN) - NOTE: lowercase!
  if (typeof window.taxi === 'undefined') {
    console.error('❌ Taxi.js not found! Make sure BOTH @unseenco/e AND @unseenco/taxi CDN scripts are loaded.');
    return null;
  }
  
  // Create renderer and transition classes (now that taxi is loaded)
  const DefaultRenderer = createDefaultRenderer();
  const HomeRenderer = createHomeRenderer();
  const CollectionsRenderer = createCollectionsRenderer();
  const ProductRenderer = createProductRenderer();
  const DefaultTransition = createDefaultTransition();
  
  // CRITICAL DEBUG: Check if HTML structure is correct
  const taxiWrapper = document.querySelector('[data-taxi]');
  const taxiView = document.querySelector('[data-taxi-view]');
  
  console.log('🔍 HTML Structure Check:');
  console.log('  data-taxi element:', taxiWrapper ? '✅ FOUND' : '❌ NOT FOUND');
  console.log('  data-taxi-view element:', taxiView ? '✅ FOUND' : '❌ NOT FOUND');
  
  if (!taxiWrapper || !taxiView) {
    console.error('⚠️⚠️⚠️ CRITICAL ERROR ⚠️⚠️⚠️');
    console.error('Your Webflow HTML is missing data-taxi or data-taxi-view!');
    console.error('This is WHY the page jumps - Taxi.js cannot work without proper HTML structure!');
    console.error('See TAXI-WEBFLOW-SETUP.md for instructions.');
    console.error('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
  }
  
  // Initialize Taxi (using global taxi from CDN - lowercase!)
  const taxiInstance = new window.taxi.Core({
    // Links to intercept (exclude external, anchors, etc.)
    links: 'a:not([target]):not([href^="#"]):not([data-taxi-ignore])',
    
    // Remove old content after transition (clean DOM)
    removeOldContent: true,
    
    // Allow navigation interruption
    allowInterruption: false,
    
    // Enable built-in prefetch on hover/focus
    enablePrefetch: true,
    
    // Transitions - simple fade for all
    transitions: {
      default: DefaultTransition,
    },
    
    // Renderers (page-specific logic)
    renderers: {
      default: DefaultRenderer,
      home: HomeRenderer,
      collections: CollectionsRenderer,
      product: ProductRenderer,
    },
  });
  
  // Initialize navigation (hamburger menu)
  initScalingHamburgerNavigation();
  updateActiveNavLinks();
  
  // Disable native scroll restoration (we handle it manually)
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  
  // CRITICAL FIX: Save scroll position BEFORE navigation starts
  let savedScrollPosition = 0;
  
  // Intercept clicks BEFORE Taxi.js to save scroll position
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && !link.hasAttribute('target') && !link.getAttribute('href').startsWith('#') && !link.hasAttribute('data-taxi-ignore')) {
      savedScrollPosition = window.scrollY;
      console.log('💾 Saved scroll position on click:', savedScrollPosition);
    }
  }, true); // Capture phase - runs BEFORE Taxi.js
  
  // Global hooks using official event names
  taxiInstance.on('NAVIGATE_IN', ({ to }) => {
    console.log('📥 NAVIGATE_IN:', to.page?.dataset?.taxiView || 'unknown');
    
    // Unlock scroll after new page is added
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });
  
  taxiInstance.on('NAVIGATE_OUT', ({ from, trigger }) => {
    const pageType = from.page?.dataset?.taxiView || 'unknown';
    console.log('📤 NAVIGATE_OUT:', pageType);
    
    // CRITICAL FIX: Lock scroll position IMMEDIATELY to prevent jump
    // Skip for back button (scroll will be restored)
    if (trigger !== 'popstate' && savedScrollPosition !== undefined) {
      console.log('🔒 Locking scroll at position:', savedScrollPosition);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollPosition}px`;
      document.body.style.width = '100%';
    }
    
    // Save collections snapshot IMMEDIATELY (before any scrolling)
    if (pageType === 'collections') {
      const currentScrollY = window.scrollY || window.pageYOffset;
      console.log(`💾 [EARLY SAVE] Saving collections snapshot at scroll position: ${currentScrollY}px`);
      saveCollectionsSnapshot(window.location.href);
    }
    
    // Close navigation when leaving page
    closeNav();
  });

  taxiInstance.on('NAVIGATE_END', ({ to, trigger }) => {
    console.log('✅ NAVIGATE_END:', to.page?.dataset?.taxiView || 'unknown', { trigger });
    
    // Update active navigation links based on current page
    updateActiveNavLinks(window.location.pathname);
    
    // Re-initialize Webflow interactions after every navigation
    reinitWebflow();
    
    // Note: Scroll handling is done in:
    // - DefaultTransition.onEnter() for normal navigation (scroll to top)
    // - state.js restoreCollectionsSnapshotIfPossible() for back button
  });
  
  taxiInstance.on('NAVIGATE_ERROR', (error) => {
    console.error('❌ Navigation error:', error);
  });
  
  console.log('✅ Taxi.js initialized successfully!');
  
  return taxiInstance;
}
