import createDefaultRenderer from './DefaultRenderer.js';
import { initAbout } from '../pages/about.js';

export default function createAboutRenderer() {
  const DefaultRenderer = createDefaultRenderer();

  return class AboutRenderer extends DefaultRenderer {
    initialLoad() {
      this.onEnter();
      this.onEnterCompleted();
    }

    async onEnter() {
      await initAbout();
    }
  };
}

