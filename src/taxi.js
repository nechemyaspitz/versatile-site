// Taxi.js initialization - MUCH simpler than Barba!
import Taxi from '@unseenco/taxi';
import { reinitWebflow } from './utils/webflow.js';

// Import renderers (page-specific logic)
import DefaultRenderer from './renderers/DefaultRenderer.js';
import HomeRenderer from './renderers/HomeRenderer.js';
import CollectionsRenderer from './renderers/CollectionsRenderer.js';
import ProductRenderer from './renderers/ProductRenderer.js';

// Import transitions
import DefaultTransition from './transitions/DefaultTransition.js';
import MorphTransition from './transitions/MorphTransition.js';

export function initTaxi() {
  console.log('🚕 Taxi.js initializing...');
  
  // Initialize Taxi
  const taxi = new Taxi({
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

