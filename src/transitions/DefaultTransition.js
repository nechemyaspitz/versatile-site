// Default fade transition
export default function createDefaultTransition() {
  if (!window.taxi) {
    console.error('taxi not loaded!');
    return class {};
  }
  
  return class DefaultTransition extends window.taxi.Transition {
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
    
    onEnter({ to, trigger, done }) {
      if (!window.gsap) {
        done();
        return;
      }
      
      // Scroll to top BEFORE the fade-in animation starts
      // This ensures new page is at top when it becomes visible
      window.scrollTo(0, 0);
      
      gsap.set(to, { opacity: 0 });
      
      gsap.to(to, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: done,
      });
    }
  };
}
