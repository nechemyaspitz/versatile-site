// Collections page renderer - handles product filtering & infinite scroll
import createDefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';

export default function createCollectionsRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class CollectionsRenderer extends DefaultRenderer {
    // Instance variables
    filterInstance = null;
    isInitialized = false;
  
    /**
     * Initial load - set up persistent features
     */
    async initialLoad() {
      console.log('🎬 Collections: Initial load');
      await this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Initialize filter BEFORE transition (only if not cached)
     */
    async onEnter() {
      console.log('🛍️ Collections page entering');
      
      // Check if this page was cached (already initialized)
      if (this.isInitialized && this.filterInstance) {
        console.log('✅ Collections: Page cached, skipping re-initialization');
        return;
      }
      
      console.log('🛍️ Collections: Initializing filter BEFORE transition...');
      
      // Initialize product filter & infinite scroll BEFORE transition
      this.filterInstance = await initCollections();
      this.isInitialized = true;
      console.log('✅ Collections filter initialized');
    }
    
    /**
     * Enter completed: Nothing to do (filter already initialized)
     */
    onEnterCompleted() {
      console.log('✅ Collections page enter complete');
    }
    
    /**
     * Leave: Prepare to exit (cleanup happens in onLeaveCompleted)
     */
    onLeave() {
      console.log('👋 Collections page leaving');
    }
    
    /**
     * Leave completed: Keep filter alive (page is cached)
     */
    onLeaveCompleted() {
      // DON'T destroy filter - we're caching the page for instant back button!
      // The filter instance will be reused when navigating back
      console.log('💾 Collections: Keeping filter alive (page cached)');
    }
  };
}

