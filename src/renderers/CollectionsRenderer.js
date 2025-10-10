// Collections page renderer
import createDefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';

export default function createCollectionsRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class CollectionsRenderer extends DefaultRenderer {
    initialLoad() {
      // Don't call initCollections() here - let onEnter() handle it
      this.onEnter();
      this.onEnterCompleted();
    }
    
    async onEnter() {
      // Get trigger from global variable set by NAVIGATE_IN hook
      const trigger = window.__taxiNavigationTrigger;
      const isBackButton = trigger === 'popstate';
      console.log('🎬 CollectionsRenderer onEnter - trigger:', trigger, 'isBackButton:', isBackButton);
      
      // CRITICAL: Reveal page BEFORE init to prevent flash
      // SmartTransition sets opacity:0, so we must reveal immediately
      const view = document.querySelector('[data-taxi-view="collections"]');
      if (view) {
        if (window.gsap) {
          window.gsap.set(view, { opacity: 1 });
        } else {
          view.style.opacity = '1';
        }
        console.log('  👁️  Page revealed (from renderer)');
      }
      
      // Pass back button flag to initCollections
      await initCollections(isBackButton);
    }
  };
}
