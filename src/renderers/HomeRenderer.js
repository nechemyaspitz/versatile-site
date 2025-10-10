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
    }
    
    async onLeave({ done }) {
      // Play exit animation before leaving
      const homeState = getState('home');
      
      if (homeState?.playExitAnimation) {
        const exitTimeline = homeState.playExitAnimation();
        
        if (exitTimeline) {
          // Wait for exit animation to complete
          exitTimeline.eventCallback('onComplete', () => {
            done();
          });
        } else {
          done();
        }
      } else {
        done();
      }
    }
  };
}
