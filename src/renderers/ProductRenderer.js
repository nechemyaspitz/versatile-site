// Product page renderer
import createDefaultRenderer from './DefaultRenderer.js';
import { initProduct } from '../pages/product.js';

export default function createProductRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class ProductRenderer extends DefaultRenderer {
    initialLoad() {
      initProduct();
      this.onEnter();
      this.onEnterCompleted();
    }
    
    async onEnter() {
      await initProduct();
    }
  };
}
