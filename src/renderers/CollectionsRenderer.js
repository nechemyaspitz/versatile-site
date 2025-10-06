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
      // Pass empty object for initial load (no trigger)
      await this.onEnter({});
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Try to restore snapshot, or initialize fresh
     */
    async onEnter({ trigger }) {
      console.log('🛍️ Collections page entering', { trigger });
      this.navigationTrigger = trigger;
      
      // If back button and we have a snapshot, restore it
      if (trigger === 'popstate') {
        console.log('⬅️ Back button detected, attempting snapshot restore...');
        const restored = restoreCollectionsSnapshotIfPossible();
        
        if (restored) {
          console.log('✅ Snapshot restored successfully');
          // Scroll position is restored in NAVIGATE_END hook
          return; // Don't re-initialize
        }
        
        console.log('⚠️ No snapshot found, will initialize fresh');
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
    onLeave({ trigger, to }) {
      console.log('👋 Collections page leaving', { trigger, toPage: to?.page?.dataset?.taxiView });
      
      // Save snapshot when navigating to product page (not on back button)
      if (to?.page?.dataset?.taxiView === 'product' && trigger !== 'popstate') {
        console.log('💾 Saving collections snapshot before navigating to product...');
        saveCollectionsSnapshot(window.location.href);
      }
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

