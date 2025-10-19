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
      // Reveal page immediately (must be synchronous)
      const view = document.querySelector('[data-taxi-view="about"]');
      if (view) {
        view.style.opacity = '1';
        if (window.gsap) {
          window.gsap.set(view, { opacity: 1, force3D: false });
        }
      }
      
      await initAbout();
    }
  };
}

