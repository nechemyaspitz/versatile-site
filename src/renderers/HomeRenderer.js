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
    
    onLeave() {
      // Play exit animation
      const homeState = getState('home');
      if (homeState?.playExitAnimation) {
        const exitTimeline = homeState.playExitAnimation();
        // Return a promise that resolves when animation completes
        return new Promise((resolve) => {
          if (exitTimeline) {
            exitTimeline.eventCallback('onComplete', resolve);
          } else {
            resolve();
          }
        });
      }
    }
  };
}
