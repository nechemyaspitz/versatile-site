// Home page renderer
import createDefaultRenderer from './DefaultRenderer.js';
import { initHome } from '../pages/home.js';
import { getState } from '../core/state.js';

export default function createHomeRenderer() {
  const DefaultRenderer = createDefaultRenderer();
  
  return class HomeRenderer extends DefaultRenderer {
    initialLoad() {
      initHome();
      this.onEnter();
      this.onEnterCompleted();
    }
    
    async onEnter() {
      await initHome();
      
      // Setup scroll animations on every page entry (with slight delay for DOM readiness)
      requestAnimationFrame(() => {
        const homeState = getState('home');
        if (homeState?.setupScrollAnimations) {
          homeState.setupScrollAnimations();
        }
      });
    }
  };
}
