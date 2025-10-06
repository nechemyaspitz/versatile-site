// Collections page renderer - handles product filtering & infinite scroll
import createDefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';
import { saveCollectionsSnapshot, restoreCollectionsSnapshotIfPossible } from '../core/state.js';

export default function createCollectionsRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class CollectionsRenderer extends DefaultRenderer {
    // Instance variables
    filterInstance = null;
    navigationTrigger = null;
  
    /**
     * Initial load - set up persistent features
     */
    async initialLoad() {
      console.log('🎬 Collections: Initial load');
      await this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Try to restore snapshot, or initialize fresh
     */
    async onEnter() {
      console.log('🛍️ Collections page entering');
      
      // Check if we have a snapshot (indicates back button navigation)
      const hasSnapshot = restoreCollectionsSnapshotIfPossible();
      
      if (hasSnapshot) {
        console.log('✅ Snapshot restored successfully (back button)');
        // Scroll position is restored in NAVIGATE_END hook
        return; // Don't re-initialize
      }
      
      // Fresh initialization (first load or no snapshot)
      console.log('🛍️ Collections: Initializing filter...');
      this.filterInstance = await initCollections();
      console.log('✅ Collections filter initialized');
    }
    
    /**
     * Enter completed: Nothing to do
     */
    onEnterCompleted() {
      console.log('✅ Collections page enter complete');
    }
    
    /**
     * Leave: Save snapshot before exiting
     */
    onLeave() {
      console.log('👋 Collections page leaving');
      
      // Always save snapshot when leaving collections page
      // (Will be restored if user clicks back button)
      console.log('💾 Saving collections snapshot...');
      saveCollectionsSnapshot(window.location.href);
    }
    
    /**
     * Leave completed: Cleanup
     */
    onLeaveCompleted() {
      // Cleanup filter instance (page will be removed from DOM)
      if (this.filterInstance?.destroy) {
        this.filterInstance.destroy();
        this.filterInstance = null;
        console.log('🗑️ Collections filter destroyed');
      }
    }
  };
}

