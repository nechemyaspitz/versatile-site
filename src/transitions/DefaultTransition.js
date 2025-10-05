// Default fade transition - simple and smooth
import { Transition } from '@unseenco/taxi';

export default class DefaultTransition extends Transition {
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
}

