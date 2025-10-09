// Collections page renderer
import createDefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';
import { restoreCollectionsSnapshotIfPossible } from '../core/state.js';

export default function createCollectionsRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class CollectionsRenderer extends DefaultRenderer {
    initialLoad() {
      initCollections();
      this.onEnter();
      this.onEnterCompleted();
    }
    
    async onEnter() {
      // Try to restore from snapshot (back button)
      const hasSnapshot = restoreCollectionsSnapshotIfPossible();
      
      if (hasSnapshot) {
        return; // Don't re-initialize
      }
      
      // Fresh initialization
      await initCollections();
    }
  };
}
