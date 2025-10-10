// Home page transition with custom exit animation
import { getState } from '../core/state.js';

export default function createHomeTransition() {
  if (!window.taxi) {
    console.error('taxi not loaded!');
    return class {};
  }
  
  return class HomeTransition extends window.taxi.Transition {
    async onLeave({ from, done }) {
      if (!window.gsap) {
        done();
        return;
      }
      
      // Get home page state and play exit animation
      const homeState = getState('home');
      
      if (homeState?.playExitAnimation) {
        const exitTimeline = homeState.playExitAnimation();
        
        if (exitTimeline) {
          // Wait for exit animation to complete
          exitTimeline.eventCallback('onComplete', () => {
            // Then fade out the container
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
        // Fallback: just fade out
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

