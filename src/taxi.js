// Taxi.js initialization - MUCH simpler than Barba!
import { reinitWebflow } from './utils/webflow.js';

// Import renderer factories
import createDefaultRenderer from './renderers/DefaultRenderer.js';
import createHomeRenderer from './renderers/HomeRenderer.js';
import createCollectionsRenderer from './renderers/CollectionsRenderer.js';
import createProductRenderer from './renderers/ProductRenderer.js';

// Import transition factories
import createDefaultTransition from './transitions/DefaultTransition.js';
import createMorphTransition from './transitions/MorphTransition.js';

export function initTaxi() {
  console.log('🚕 Taxi.js initializing...');
  
  // Check if Taxi is available (loaded via CDN)
  if (typeof window.Taxi === 'undefined') {
    console.error('❌ Taxi.js not found! Make sure the CDN script is loaded.');
    return null;
  }
  
  // Create renderer and transition classes (now that Taxi is loaded)
  const DefaultRenderer = createDefaultRenderer();
  const HomeRenderer = createHomeRenderer();
  const CollectionsRenderer = createCollectionsRenderer();
  const ProductRenderer = createProductRenderer();
  const DefaultTransition = createDefaultTransition();
  const MorphTransition = createMorphTransition();
  
  // Initialize Taxi (using global Taxi from CDN)
  const taxi = new window.Taxi.Core({
    // Links to intercept (exclude external, anchors, etc.)
    links: 'a:not([target]):not([href^="#"]):not([data-no-taxi])',
    
    // Remove old content after transition
    removeOldContent: true,
    
    // Enable built-in preloading
    allowInterruption: true,
    
    // Transitions
    transitions: {
      default: DefaultTransition,
      morph: MorphTransition,
    },
    
    // Renderers (page-specific logic)
    renderers: {
      default: DefaultRenderer,
      home: HomeRenderer,
      collections: CollectionsRenderer,
      product: ProductRenderer,
    },
  });
  
  // Global hooks
  taxi.on('NAVIGATE_START', ({ to }) => {
    console.log('🚀 Navigating to:', to.page.url);
  });
  
  taxi.on('NAVIGATE_END', ({ to, trigger }) => {
    console.log('✅ Navigation complete:', to.page.url);
    
    // Reinit Webflow interactions
    reinitWebflow();
    
    // Log navigation type
    if (trigger === 'popstate') {
      console.log('⬅️ Back/Forward navigation');
    }
  });
  
  taxi.on('NAVIGATE_ERROR', (error) => {
    console.error('❌ Navigation error:', error);
  });
  
  return taxi;
}

