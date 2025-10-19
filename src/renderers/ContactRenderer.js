import createDefaultRenderer from './DefaultRenderer.js';
import { initContact } from '../pages/contact.js';
import { getState } from '../core/state.js';

export default function createContactRenderer() {
  const DefaultRenderer = createDefaultRenderer();

  return class ContactRenderer extends DefaultRenderer {
    initialLoad() {
      this.onEnter();
      this.onEnterCompleted();
    }

    async onEnter() {
      await initContact();
    }
    
    onLeaveCompleted() {
      // Cleanup form handlers
      const contactState = getState('contact');
      if (contactState?.destroy) {
        contactState.destroy();
      }
    }
  };
}

