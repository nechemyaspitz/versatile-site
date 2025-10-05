// Collections page renderer - handles product filtering & infinite scroll
import DefaultRenderer from './DefaultRenderer.js';
import { initCollections } from '../pages/collections.js';

export default class CollectionsRenderer extends DefaultRenderer {
  // Instance variable for filter
  filterInstance = null;
  
  // Store click listeners (so we can clean them up)
  clickHandler = null;
  
  onEnter() {
    super.onEnter();
    console.log('🛍️ Collections page entering');
  }
  
  async onEnterCompleted() {
    super.onEnterCompleted();
    
    // Initialize product filter & infinite scroll
    this.filterInstance = await initCollections();
    console.log('✅ Collections filter initialized');
    
    // Attach click listeners for morph animation
    this.initClickListeners();
  }
  
  initClickListeners() {
    // Event delegation - attach to container (persists across navigations!)
    this.clickHandler = (e) => {
      const productLink = e.target.closest('.collection_image-cover, .collection_details');
      if (!productLink) return;
      
      // Store clicked product info for morph transition
      const gridItem = productLink.closest('.collection_grid-item');
      if (gridItem) {
        const productSlug = gridItem.getAttribute('data-base-url');
        if (productSlug) {
          // Store in sessionStorage for morph transition
          sessionStorage.setItem('morphFrom', JSON.stringify({
            slug: productSlug.replace('/collections/', ''),
            rect: gridItem.getBoundingClientRect(),
          }));
        }
      }
    };
    
    // Attach to product grid container
    const grid = document.querySelector('.product-grid');
    if (grid) {
      grid.addEventListener('click', this.clickHandler);
      console.log('🔗 Collections click listeners attached');
    }
  }
  
  onLeave() {
    super.onLeave();
    
    // Cleanup filter instance
    if (this.filterInstance?.destroy) {
      this.filterInstance.destroy();
      console.log('🗑️ Collections filter destroyed');
    }
    
    // Remove click listener
    const grid = document.querySelector('.product-grid');
    if (grid && this.clickHandler) {
      grid.removeEventListener('click', this.clickHandler);
      console.log('🗑️ Collections click listeners removed');
    }
  }
}

