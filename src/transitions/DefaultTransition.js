// Default fade transition - simple and smooth
// Factory function to create transition class when Taxi.js is loaded

export default function createDefaultTransition() {
  if (!window.taxi) {
    console.error('taxi not loaded!');
    return class {}; // Return empty class as fallback
  }
  
  return class DefaultTransition extends window.taxi.Transition {
    /**
     * Animate out the current page
     * @param {{ from: HTMLElement, trigger: string|HTMLElement|false, done: Function }} props
     */
    onLeave({ from, trigger, done }) {
      console.log('👋 Default transition: leaving', { trigger });
      
      if (!window.gsap) {
        done();
        return;
      }
      
      gsap.to(from, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: done,
      });
    }
    
    /**
     * Animate in the new page
     * @param {{ to: HTMLElement, trigger: string|HTMLElement|false, done: Function }} props
     */
    onEnter({ to, trigger, done }) {
      console.log('📥 Default transition: entering', { trigger });
      
      if (!window.gsap) {
        done();
        return;
      }
      
      // Scroll to top immediately (while page is invisible)
      // Skip if back button (scroll will be restored by snapshot)
      if (trigger !== 'popstate') {
        window.scrollTo(0, 0);
      }
      
      // Start hidden
      gsap.set(to, { opacity: 0 });
      
      // Fade in
      gsap.to(to, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: done,
      });
    }
  };
}
