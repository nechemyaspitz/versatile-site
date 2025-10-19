// Product page renderer
import createDefaultRenderer from './DefaultRenderer.js';
import { initProduct } from '../pages/product.js';

export default function createProductRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class ProductRenderer extends DefaultRenderer {
    initialLoad() {
      // Don't call initProduct here - onEnter will handle it
      this.onEnter();
      this.onEnterCompleted();
    }
    
    async onEnter() {
      await initProduct();
    }
  };
}
