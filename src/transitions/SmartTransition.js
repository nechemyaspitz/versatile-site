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
      
      // Get the state for the page we're leaving from
      let exitAnimation = null;
      
      if (viewName === 'home') {
        const homeState = getState('home');
        exitAnimation = homeState?.playExitAnimation?.();
      } else if (viewName === 'collections') {
        const collectionsState = getState('collections');
        exitAnimation = collectionsState?.playExitAnimation?.();
      } else if (viewName === 'product') {
        const productState = getState('product');
        exitAnimation = productState?.playExitAnimation?.();
      }
      
      if (exitAnimation) {
        // Play custom exit animation, then quick fade out
        exitAnimation.eventCallback('onComplete', () => {
          gsap.to(from, {
            opacity: 0,
            duration: 0.15,
            ease: 'power2.out',
            onComplete: done,
          });
        });
      } else {
        // No custom animation - standard fade out
        gsap.to(from, {
          opacity: 0,
          duration: 0.2,
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
      
      // Scroll to top
      window.scrollTo(0, 0);
      
      // Keep page hidden - let page animations control the reveal
      gsap.set(to, { opacity: 0 });
      
      // Transition complete - renderer will handle page animations
      done();
    }
  };
}

