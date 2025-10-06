// Collections page renderer - handles product filtering & infinite scroll
import createDefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';

export default function createCollectionsRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class CollectionsRenderer extends DefaultRenderer {
    // Instance variables
    filterInstance = null;
  
    /**
     * Initial load - set up persistent features
     */
    async initialLoad() {
      console.log('🎬 Collections: Initial load');
      await this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Initialize filter BEFORE transition
     */
    async onEnter() {
      console.log('🛍️ Collections page entering');
      console.log('🛍️ Collections: Initializing filter BEFORE transition...');
      
      // Initialize product filter & infinite scroll BEFORE transition
      this.filterInstance = await initCollections();
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
     * Leave completed: Cleanup filter
     */
    onLeaveCompleted() {
      // Cleanup filter instance
      if (this.filterInstance?.destroy) {
        this.filterInstance.destroy();
        this.filterInstance = null;
        console.log('🗑️ Collections filter destroyed');
      }
    }
  };
}

