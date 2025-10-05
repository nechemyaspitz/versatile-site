// Product page renderer - handles image carousel
import createDefaultRenderer from './DefaultRenderer.js';
import { initProduct } from '../pages/product.js';

export default function createProductRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class ProductRenderer extends DefaultRenderer {
    // Instance variable for carousel
    carouselInstance = null;
    
    onEnter() {
      super.onEnter();
      console.log('📦 Product page entering');
    }
    
    async onEnterCompleted() {
      super.onEnterCompleted();
      
      // Initialize product carousel
      this.carouselInstance = await initProduct();
      console.log('✅ Product carousel initialized');
    }
    
    onLeave() {
      super.onLeave();
      
      // Cleanup carousel if needed
      if (this.carouselInstance?.destroy) {
        this.carouselInstance.destroy();
        console.log('🗑️ Product carousel destroyed');
      }
    }
  };
}

