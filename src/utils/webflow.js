// Webflow interactions re-initialization
export const reinitWebflow = () => {
  if (window.Webflow && window.Webflow.require) {
    try {
      window.Webflow.destroy();
      window.Webflow.ready();
      window.Webflow.require('ix2').init();
    } catch (e) {
      // no-op
    }
  }
};

