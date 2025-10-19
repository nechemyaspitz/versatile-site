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
      await initContact();
    }
  };
}

