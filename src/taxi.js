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
  
  // Initialize Taxi
  const taxiInstance = new window.taxi.Core({
    links: 'a:not([target]):not([href^="#"]):not([data-taxi-ignore])',
    removeOldContent: true,
    allowInterruption: false,
    enablePrefetch: true,
    
    transitions: {
      default: DefaultTransition,
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
  });
  
  taxiInstance.on('NAVIGATE_ERROR', (error) => {
    console.error('❌ Navigation error:', error);
  });
  
  return taxiInstance;
}
