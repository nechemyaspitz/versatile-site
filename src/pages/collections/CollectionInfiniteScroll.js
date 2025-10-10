/**
 * CollectionInfiniteScroll.js
 * Manages infinite scroll using IntersectionObserver
 */

export class CollectionInfiniteScroll {
  constructor(containerSelector, callback) {
    this.container = document.querySelector(containerSelector);
    this.callback = callback;
    this.observer = null;
    this.sentinel = null;
    
    if (!this.container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }
    
    console.log('♾️  CollectionInfiniteScroll initialized');
  }
  
  /**
   * Initialize infinite scroll observer
   */
  init() {
    // Remove old sentinel if exists
    if (this.sentinel) {
      this.sentinel.remove();
    }
    
    // Create sentinel element
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'infinite-scroll-sentinel';
    this.sentinel.style.cssText = 'height: 1px; width: 100%; clear: both;';
    
    // Place sentinel right after the container
    this.container.after(this.sentinel);
    
    // Create observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log('  ♾️  Sentinel visible - loading more items');
            this.callback();
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '200px', // Start loading before reaching bottom
        threshold: 0,
      }
    );
    
    this.observer.observe(this.sentinel);
    console.log('  ♾️  Observer attached to sentinel');
  }
  
  /**
   * Destroy observer and sentinel
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.sentinel) {
      this.sentinel.remove();
      this.sentinel = null;
    }
    
    console.log('  ♾️  Infinite scroll destroyed');
  }
}

