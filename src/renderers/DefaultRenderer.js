// Default renderer - base class for all pages
// Factory function to create renderer class when Taxi.js is loaded

export default function createDefaultRenderer() {
  if (!window.Taxi) {
    console.error('Taxi.js not loaded!');
    return class {}; // Return empty class as fallback
  }
  
  return class DefaultRenderer extends window.Taxi.Renderer {
    // Called when content is added to DOM (before transition in)
    onEnter() {
      console.log('📄 Page entering:', this.content.dataset.taxiView);
    }
    
    // Called after transition completes
    onEnterCompleted() {
      console.log('✅ Page enter complete');
    }
    
    // Called before leaving page
    onLeave() {
      console.log('👋 Page leaving');
    }
    
    // Called after page is removed from DOM
    onLeaveCompleted() {
      console.log('🗑️ Page cleanup complete');
    }
  };
}

