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
     */
    onLeave({ from, done }) {
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
     */
    onEnter({ to, done }) {
      if (!window.gsap) {
        done();
        return;
      }
      
      // Start hidden
      gsap.set(to, { opacity: 0 });
      
      // Fade in
      gsap.to(to, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: done,
      });
    }
  };
}

