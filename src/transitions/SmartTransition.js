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
      
      // Check for page-specific exit animations
      const homeState = getState('home');
      const collectionsState = getState('collections');
      
      console.log('🚪 SmartTransition onLeave:', {
        homeState: !!homeState,
        collectionsState: !!collectionsState,
        homeExit: !!homeState?.playExitAnimation,
        collectionsExit: !!collectionsState?.playExitAnimation,
      });
      
      const exitAnimation = homeState?.playExitAnimation?.() || collectionsState?.playExitAnimation?.();
      
      if (exitAnimation) {
        console.log('✨ Playing custom exit animation');
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
        console.log('⚠️ No custom animation found - using standard fade');
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

