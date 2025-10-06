// Taxi.js initialization - MUCH simpler than Barba!
import { reinitWebflow } from './utils/webflow.js';
import { closeNav, updateActiveNavLinks, initScalingHamburgerNavigation } from './components/navigation.js';

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
  
  // Global hooks using official event names
  taxiInstance.on('NAVIGATE_IN', ({ to }) => {
    console.log('📥 NAVIGATE_IN:', to.page?.dataset?.taxiView || 'unknown');
  });
  
  taxiInstance.on('NAVIGATE_OUT', ({ from }) => {
    console.log('📤 NAVIGATE_OUT:', from.page?.dataset?.taxiView || 'unknown');
    
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
