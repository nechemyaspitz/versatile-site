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
      
      // Pass back button flag to initCollections
      await initCollections(isBackButton);
    }
  };
}
