// Default renderer - base class for all pages
export default function createDefaultRenderer() {
  if (!window.taxi) {
    console.error('taxi not loaded!');
    return class {};
  }
  
  return class DefaultRenderer extends window.taxi.Renderer {
    initialLoad() {
      this.onEnter();
      this.onEnterCompleted();
    }
    
    onEnter() {
      // Override in child renderers
    }
    
    onEnterCompleted() {
      // Override in child renderers
    }
    
    onLeave() {
      // Override in child renderers
    }
    
    onLeaveCompleted() {
      // Override in child renderers
    }
  };
}
