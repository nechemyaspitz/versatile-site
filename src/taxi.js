// Taxi.js initialization
import { reinitWebflow } from './utils/webflow.js';
import { closeNav, updateActiveNavLinks, initScalingHamburgerNavigation } from './components/navigation.js';

// Import renderer factories
import createDefaultRenderer from './renderers/DefaultRenderer.js';
import createHomeRenderer from './renderers/HomeRenderer.js';
import createCollectionsRenderer from './renderers/CollectionsRenderer.js';
import createProductRenderer from './renderers/ProductRenderer.js';

// Import transition factories
import createDefaultTransition from './transitions/DefaultTransition.js';
import createHomeTransition from './transitions/HomeTransition.js';

export function initTaxi() {
  // Check if taxi is available (loaded via CDN)
  if (typeof window.taxi === 'undefined') {
    console.error('❌ Taxi.js not found! Make sure BOTH @unseenco/e AND @unseenco/taxi CDN scripts are loaded.');
    return null;
  }
  
  // Create renderer and transition classes
  const DefaultRenderer = createDefaultRenderer();
  const HomeRenderer = createHomeRenderer();
  const CollectionsRenderer = createCollectionsRenderer();
  const ProductRenderer = createProductRenderer();
  const DefaultTransition = createDefaultTransition();
  const HomeTransition = createHomeTransition();
  
  // Initialize Taxi
  const taxiInstance = new window.taxi.Core({
    links: 'a:not([target]):not([href^="#"]):not([data-taxi-ignore])',
    removeOldContent: true,
    allowInterruption: false,
    enablePrefetch: true,
    
    transitions: {
      default: DefaultTransition,
      homeExit: HomeTransition,
    },
    
    renderers: {
      default: DefaultRenderer,
      home: HomeRenderer,
      collections: CollectionsRenderer,
      product: ProductRenderer,
    },
  });
  
  // Add custom transition routes for home page exit
  // Use homeExit transition when leaving FROM home renderer TO any page
  taxiInstance.addRoute('*', 'homeExit', { from: 'home' });
  
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
    // Store trigger for renderers to access
    window.__taxiNavigationTrigger = trigger;
    console.log('🚕 NAVIGATE_IN - trigger:', trigger);
  });
  
  taxiInstance.on('NAVIGATE_OUT', ({ from }) => {
    // Close navigation when leaving page (skip scroll restore during navigation)
    closeNav(true);
    
    // CRITICAL FIX: Stop Lenis momentum scroll before navigation
    // This prevents scroll momentum from carrying over to the next page
    if (window.lenis) {
      window.lenis.stop();
      console.log('🛑 Stopped Lenis momentum scroll');
    }
  });

  taxiInstance.on('NAVIGATE_END', ({ to }) => {
    // Update active navigation links
    updateActiveNavLinks(window.location.pathname);
    
    // Re-initialize Webflow interactions
    reinitWebflow();
    
    // CRITICAL FIX: Restart Lenis after navigation completes
    if (window.lenis) {
      window.lenis.start();
      console.log('▶️ Restarted Lenis');
    }
    
    // Handle pending scroll restoration AFTER everything is fully settled
    if (window.__pendingScrollRestoration) {
      const productId = window.__pendingScrollRestoration;
      window.__pendingScrollRestoration = null; // Clear it
      
      console.log('🔍 Executing delayed scroll restoration for:', productId);
      
      // Wait a bit for page to fully settle, then scroll
      setTimeout(() => {
        if (window.lenis) {
          window.lenis.resize(); // Recalculate
          
          const productEl = document.querySelector(`[data-product-id="${productId}"]`);
          if (productEl) {
            const rect = productEl.getBoundingClientRect();
            const elementTop = window.pageYOffset + rect.top;
            
            console.log('🎯 Smoothly scrolling to product:', productId);
            console.log('  - Element position:', elementTop);
            console.log('  - Target (with offset):', elementTop - 100);
            
            // Smooth, quick animation (0.6s)
            window.lenis.scrollTo(productEl, {
              duration: 0.6,
              offset: -100,
              easing: (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2  // easeInOutQuad
            });
            
            setTimeout(() => {
              console.log('✅ Final scroll position:', window.scrollY);
            }, 700);
          } else {
            console.warn('⚠️ Product element not found:', productId);
          }
        }
      }, 200); // Wait 200ms for everything to settle
    }
  });
  
  taxiInstance.on('NAVIGATE_ERROR', (error) => {
    console.error('❌ Navigation error:', error);
  });
  
  return taxiInstance;
}
