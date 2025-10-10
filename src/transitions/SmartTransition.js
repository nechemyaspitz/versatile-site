// Smart transition that detects home page and plays custom animations
import { getState } from '../core/state.js';

export default function createSmartTransition() {
  if (!window.taxi) {
    console.error('taxi not loaded!');
    return class {};
  }
  
  return class SmartTransition extends window.taxi.Transition {
    onLeave({ from, done }) {
      if (!window.gsap) {
        done();
        return;
      }
      
      // Check if we're leaving from home page by checking for home state
      const homeState = getState('home');
      
      if (homeState?.playExitAnimation) {
        // We're on home page - play custom exit animation
        const exitTimeline = homeState.playExitAnimation();
        
        if (exitTimeline) {
          // Wait for exit animation, then fade out container
          exitTimeline.eventCallback('onComplete', () => {
            gsap.to(from, {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: done,
            });
          });
        } else {
          // Fallback: just fade out
          gsap.to(from, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: done,
          });
        }
      } else {
        // Not on home page - standard fade out
        gsap.to(from, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
          onComplete: done,
        });
      }
    }
    
    onEnter({ to, trigger, done }) {
      if (!window.gsap) {
        done();
        return;
      }
      
      // Scroll to top BEFORE the fade-in animation starts
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

