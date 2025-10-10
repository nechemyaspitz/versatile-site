// Home page renderer
import createDefaultRenderer from './DefaultRenderer.js';
import { initHome } from '../pages/home.js';

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
  };
}
