// Collections page renderer
import createDefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';

export default function createCollectionsRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class CollectionsRenderer extends DefaultRenderer {
    constructor(props) {
      super(props);
      this.pageInstance = null; // Store page instance for cleanup
    }
    
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
      
      // Pass back button flag to initCollections and store the instance
      // (Page reveal happens in CollectionsPage.init())
      this.pageInstance = await initCollections(isBackButton);
    }
    
    onLeave() {
      // CRITICAL FIX: Call destroy on page instance when leaving
      if (this.pageInstance && typeof this.pageInstance.destroy === 'function') {
        console.log('🎬 CollectionsRenderer onLeave - destroying page instance');
        this.pageInstance.destroy();
        this.pageInstance = null;
      }
    }
  };
}
