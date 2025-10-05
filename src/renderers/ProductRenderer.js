// Product page renderer - handles image carousel
import createDefaultRenderer from './DefaultRenderer.js';
import { initProduct } from '../pages/product.js';

export default function createProductRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class ProductRenderer extends DefaultRenderer {
    // Instance variable for carousel
    carouselInstance = null;
    
    /**
     * Initial load - set up persistent features
     */
    initialLoad() {
      console.log('🎬 Product: Initial load');
      this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Prepare product page
     */
    onEnter() {
      console.log('📦 Product page entering');
    }
    
    /**
     * Enter completed: Initialize carousel
     */
    async onEnterCompleted() {
      console.log('📦 Product: Initializing carousel...');
      
      // Initialize product carousel
      this.carouselInstance = await initProduct();
      console.log('✅ Product carousel initialized');
    }
    
    /**
     * Leave: Prepare to exit
     */
    onLeave() {
      console.log('👋 Product page leaving');
    }
    
    /**
     * Leave completed: Cleanup carousel
     */
    onLeaveCompleted() {
      // Cleanup carousel if needed
      if (this.carouselInstance?.destroy) {
        this.carouselInstance.destroy();
        this.carouselInstance = null;
        console.log('🗑️ Product carousel destroyed');
      }
    }
  };
}

