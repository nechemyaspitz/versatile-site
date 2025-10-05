// Default renderer - base class for all pages
import { Renderer } from '@unseenco/taxi';

export default class DefaultRenderer extends Renderer {
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
}

