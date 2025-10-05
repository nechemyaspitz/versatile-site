// Home page renderer - handles slider logic
import createDefaultRenderer from './DefaultRenderer.js';
import { initHome } from '../pages/home.js';

export default function createHomeRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class HomeRenderer extends DefaultRenderer {
    // Instance variable to track initialization
    homeInstance = null;
    
    /**
     * Initial load - set up persistent features
     */
    initialLoad() {
      console.log('🎬 Home: Initial load');
      this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Set up home page
     */
    onEnter() {
      console.log('🏠 Home page entering');
    }
    
    /**
     * Enter completed: Initialize heavy components (slider, etc.)
     */
    async onEnterCompleted() {
      console.log('🏠 Home: Initializing slider...');
      
      // Initialize home page features
      this.homeInstance = await initHome();
      console.log('✅ Home slider initialized');
    }
    
    /**
     * Leave: Prepare to exit
     */
    onLeave() {
      console.log('👋 Home page leaving');
    }
    
    /**
     * Leave completed: Cleanup
     */
    onLeaveCompleted() {
      // Cleanup slider if needed
      if (this.homeInstance?.destroy) {
        this.homeInstance.destroy();
        this.homeInstance = null;
        console.log('🗑️ Home slider destroyed');
      }
    }
  };
}

