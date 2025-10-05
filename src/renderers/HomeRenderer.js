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
    async initialLoad() {
      console.log('🎬 Home: Initial load');
      await this.onEnter();
      this.onEnterCompleted();
    }
    
    /**
     * Enter: Initialize slider BEFORE transition
     */
    async onEnter() {
      console.log('🏠 Home page entering');
      console.log('🏠 Home: Initializing slider BEFORE transition...');
      
      // Initialize home page features BEFORE transition
      this.homeInstance = await initHome();
      console.log('✅ Home slider initialized');
    }
    
    /**
     * Enter completed: Nothing to do (slider already initialized)
     */
    onEnterCompleted() {
      console.log('✅ Home page enter complete');
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

