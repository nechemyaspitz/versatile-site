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
      
      // Detect which page we're leaving FROM by checking data-taxi-view attribute
      const viewName = from.getAttribute('data-taxi-view');
      console.log('🚪 SmartTransition onLeave from:', viewName);
      
      // Get the state for the page we're leaving from
      let exitAnimation = null;
      
      if (viewName === 'home') {
        const homeState = getState('home');
        console.log('  → Home state:', !!homeState, 'Exit:', !!homeState?.playExitAnimation);
        exitAnimation = homeState?.playExitAnimation?.();
      } else if (viewName === 'collections') {
        const collectionsState = getState('collections');
        console.log('  → Collections state:', !!collectionsState, 'Exit:', !!collectionsState?.playExitAnimation);
        exitAnimation = collectionsState?.playExitAnimation?.();
      }
      
      if (exitAnimation) {
        console.log('✨ Playing custom exit animation for', viewName);
        // Play custom exit animation, then fade out
        exitAnimation.eventCallback('onComplete', () => {
          gsap.to(from, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: done,
          });
        });
      } else {
        console.log('⚠️ No custom animation for', viewName, '- using standard fade');
        // No custom animation - standard fade out
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

