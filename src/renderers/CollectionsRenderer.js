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
      // Always fresh initialization
      await initCollections();
    }
  };
}
