// Default renderer - base class for all pages
// Factory function to create renderer class when Taxi.js is loaded

export default function createDefaultRenderer() {
  if (!window.taxi) {
    console.error('taxi not loaded!');
    return class {}; // Return empty class as fallback
  }
  
  return class DefaultRenderer extends window.taxi.Renderer {
    /**
     * Called ONLY on initial page load (first visit)
     * Should call onEnter() and onEnterCompleted() manually
     */
    initialLoad() {
      console.log('🎬 Initial page load');
      this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Called when NEW content is added to DOM (after transition.onLeave, before transition.onEnter)
     */
    onEnter() {
      console.log('📄 Page entering:', this.content?.dataset?.taxiView || 'default');
    }
    
    /**
     * Called after transition.onEnter completes
     */
    onEnterCompleted() {
      console.log('✅ Page enter complete:', this.content?.dataset?.taxiView || 'default');
    }
    
    /**
     * Called before transition.onLeave (page is about to hide)
     */
    onLeave() {
      console.log('👋 Page leaving:', this.content?.dataset?.taxiView || 'default');
    }
    
    /**
     * Called after transition.onLeave completes (after old content removed)
     */
    onLeaveCompleted() {
      console.log('🗑️ Page cleanup complete');
    }
  };
}

