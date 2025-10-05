// Collections page renderer - handles product filtering & infinite scroll
import createDefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';

export default function createCollectionsRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class CollectionsRenderer extends DefaultRenderer {
    // Instance variables
    filterInstance = null;
    clickHandler = null;
  
    /**
     * Initial load - set up persistent features
     */
    initialLoad() {
      console.log('🎬 Collections: Initial load');
      this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Prepare collections page
     */
    onEnter() {
      console.log('🛍️ Collections page entering');
    }
    
    /**
     * Enter completed: Initialize filter, infinite scroll, click listeners
     */
    async onEnterCompleted() {
      console.log('🛍️ Collections: Initializing filter...');
      
      // Initialize product filter & infinite scroll
      this.filterInstance = await initCollections();
      console.log('✅ Collections filter initialized');
      
      // Attach click listeners for morph animation
      this.initClickListeners();
    }
    
    /**
     * Set up click listeners to capture product info for morph
     */
    initClickListeners() {
      // Event delegation on grid
      this.clickHandler = (e) => {
        const productLink = e.target.closest('.collection_image-cover, .collection_details');
        if (!productLink) return;
        
        // Store clicked product info for morph transition
        const gridItem = productLink.closest('.collection_grid-item');
        if (gridItem) {
          const productSlug = gridItem.getAttribute('data-base-url');
          if (productSlug) {
            const rect = gridItem.getBoundingClientRect();
            
            // Store in sessionStorage for morph transition
            sessionStorage.setItem('morphData', JSON.stringify({
              slug: productSlug.replace('/collections/', ''),
              rect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              },
              borderRadius: window.getComputedStyle(gridItem).borderRadius,
            }));
            
            console.log('💾 Stored morph data for:', productSlug);
          }
        }
      };
      
      // Attach to product grid
      const grid = document.querySelector('.product-grid');
      if (grid) {
        grid.addEventListener('click', this.clickHandler);
        console.log('🔗 Collections click listeners attached');
      }
    }
    
    /**
     * Leave: Prepare to exit (cleanup happens in onLeaveCompleted)
     */
    onLeave() {
      console.log('👋 Collections page leaving');
    }
    
    /**
     * Leave completed: Cleanup filter and listeners
     */
    onLeaveCompleted() {
      // Cleanup filter instance
      if (this.filterInstance?.destroy) {
        this.filterInstance.destroy();
        this.filterInstance = null;
        console.log('🗑️ Collections filter destroyed');
      }
      
      // Remove click listener
      const grid = document.querySelector('.product-grid');
      if (grid && this.clickHandler) {
        grid.removeEventListener('click', this.clickHandler);
        this.clickHandler = null;
        console.log('🗑️ Collections click listeners removed');
      }
    }
  };
}

