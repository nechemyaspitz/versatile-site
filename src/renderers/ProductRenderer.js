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
    async initialLoad() {
      console.log('🎬 Product: Initial load');
      await this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Initialize carousel BEFORE transition so morph has content
     */
    async onEnter() {
      console.log('📦 Product page entering');
      console.log('📦 Product: Initializing carousel BEFORE transition...');
      
      // CRITICAL: Initialize carousel BEFORE transition so slider has content
      // This ensures the morph animation has images to morph into!
      this.carouselInstance = await initProduct();
      console.log('✅ Product carousel initialized (ready for morph)');
    }
    
    /**
     * Enter completed: Nothing to do (carousel already initialized)
     */
    onEnterCompleted() {
      console.log('✅ Product page enter complete');
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

