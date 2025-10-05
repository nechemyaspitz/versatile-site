// Home page renderer - handles slider logic
import DefaultRenderer from './DefaultRenderer.js';
import { initHome } from '../pages/home.js';

export default class HomeRenderer extends DefaultRenderer {
  // Instance variable to track initialization
  homeInstance = null;
  
  onEnter() {
    super.onEnter();
    console.log('🏠 Home page entering');
  }
  
  async onEnterCompleted() {
    super.onEnterCompleted();
    
    // Initialize home page features
    this.homeInstance = await initHome();
    console.log('✅ Home slider initialized');
  }
  
  onLeave() {
    super.onLeave();
    
    // Cleanup slider if needed
    if (this.homeInstance?.destroy) {
      this.homeInstance.destroy();
      console.log('🗑️ Home slider destroyed');
    }
  }
}

