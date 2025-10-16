// Taxi.js initialization
import { reinitWebflow } from './utils/webflow.js';
import { closeNav, updateActiveNavLinks, initScalingHamburgerNavigation } from './components/navigation.js';

// Import renderer factories
import createDefaultRenderer from './renderers/DefaultRenderer.js';
import createHomeRenderer from './renderers/HomeRenderer.js';
import createCollectionsRenderer from './renderers/CollectionsRenderer.js';
import createProductRenderer from './renderers/ProductRenderer.js';

// Import transition factories
import createSmartTransition from './transitions/SmartTransition.js';

export function initTaxi() {
  // Check if taxi is available (loaded via CDN)
  if (typeof window.taxi === 'undefined') {
    console.error('Taxi.js not found! Make sure CDN scripts are loaded.');
    return null;
  }
  
  // Create renderer and transition classes
  const DefaultRenderer = createDefaultRenderer();
  const HomeRenderer = createHomeRenderer();
  const CollectionsRenderer = createCollectionsRenderer();
  const ProductRenderer = createProductRenderer();
  const SmartTransition = createSmartTransition();
  
  // Initialize Taxi
  const taxiInstance = new window.taxi.Core({
    links: 'a:not([target]):not([href^="#"]):not([data-taxi-ignore])',
    removeOldContent: true,
    allowInterruption: false,
    enablePrefetch: true,
    
    transitions: {
      default: SmartTransition,
    },
    
    renderers: {
      default: DefaultRenderer,
      home: HomeRenderer,
      collections: CollectionsRenderer,
      product: ProductRenderer,
    },
  });
  
  // Initialize navigation
  initScalingHamburgerNavigation();
  updateActiveNavLinks();
  
  // Disable native scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  
  // Store navigation trigger globally so renderers can access it
  window.__taxiNavigationTrigger = null;
  
  // Global hooks
  taxiInstance.on('NAVIGATE_IN', ({ trigger }) => {
    window.__taxiNavigationTrigger = trigger;
  });
  
  taxiInstance.on('NAVIGATE_OUT', ({ from }) => {
    closeNav(true);
    
    // Stop Lenis momentum scroll before navigation
    if (window.lenis) {
      window.lenis.stop();
    }
  });

  taxiInstance.on('NAVIGATE_END', ({ to }) => {
    updateActiveNavLinks(window.location.pathname);
    reinitWebflow();
    
    // Restart Lenis after navigation
    if (window.lenis) {
      window.lenis.start();
    }
    
    // Handle pending scroll restoration
    if (window.__pendingScrollRestoration) {
      const productId = window.__pendingScrollRestoration;
      window.__pendingScrollRestoration = null;
      
      setTimeout(() => {
        if (window.lenis) {
          window.lenis.resize();
          
          const productEl = document.querySelector(`[data-product-id="${productId}"]`);
          if (productEl) {
            window.lenis.scrollTo(productEl, {
              duration: 0.6,
              offset: -100,
              easing: (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
            });
          }
        }
      }, 200);
    }
  });
  
  taxiInstance.on('NAVIGATE_ERROR', (error) => {
    console.error('Navigation error:', error);
  });
  
  return taxiInstance;
}
