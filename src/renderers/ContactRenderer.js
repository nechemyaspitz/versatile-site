import createDefaultRenderer from './DefaultRenderer.js';
import { initContact } from '../pages/contact.js';

export default function createContactRenderer() {
  const DefaultRenderer = createDefaultRenderer();

  return class ContactRenderer extends DefaultRenderer {
    initialLoad() {
      this.onEnter();
      this.onEnterCompleted();
    }

    async onEnter() {
      // Reveal page immediately (must be synchronous)
      const view = document.querySelector('[data-taxi-view="contact"]');
      if (view) {
        view.style.opacity = '1';
        if (window.gsap) {
          window.gsap.set(view, { opacity: 1, force3D: false });
        }
      }
      
      await initContact();
    }
  };
}

