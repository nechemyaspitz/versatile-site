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
        onComplete: () => {
          // Scroll to top AFTER fade-out completes (while invisible)
          // Skip if back button (scroll will be restored by snapshot)
          if (trigger !== 'popstate') {
            console.log('🔝 Scrolling to top after fade-out (page invisible)');
            window.scrollTo(0, 0);
          } else {
            console.log('⬅️ Back button detected, NOT scrolling to top');
          }
          done();
        },
      });
    }
    
    /**
     * Animate in the new page
     * @param {{ to: HTMLElement, trigger: string|HTMLElement|false, done: Function }} props
     */
    onEnter({ to, trigger, done }) {
      console.log('📥 Default transition: entering', { 
        trigger, 
        triggerType: typeof trigger,
        isPopstate: trigger === 'popstate',
        currentScroll: window.scrollY 
      });
      
      if (!window.gsap) {
        done();
        return;
      }
      
      // Start hidden
      gsap.set(to, { opacity: 0 });
      
      // Fade in (scroll already happened in onLeave)
      gsap.to(to, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: done,
      });
    }
  };
}
