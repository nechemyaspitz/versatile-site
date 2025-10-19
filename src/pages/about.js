import { setState } from '../core/state.js';

// Page enter animation
function playPageEnterAnimation() {
  // 0. Reveal page immediately (hidden by CSS/transition to prevent FOUC)
  const view = document.querySelector('[data-taxi-view="about"]');
  if (view) {
    if (window.gsap) {
      window.gsap.set(view, { opacity: 1 });
    } else {
      // Fallback if GSAP not loaded yet
      view.style.opacity = '1';
    }
  }
  
  // 1. Footer: fade in
  if (window.gsap) {
    const footer = document.querySelector('.footer-section');
    if (footer) {
      window.gsap.set(footer, { opacity: 0 });
      window.gsap.to(footer, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.inOut',
        delay: 0.2,
      });
    }
  }
  
  // Future: Add enter animations here (fade in, slide up, etc.)
}

// Page exit animation
function playPageExitAnimation() {
  if (!window.gsap) return Promise.resolve();
  
  const tl = window.gsap.timeline();
  
  // Footer: fade out
  const footer = document.querySelector('.footer-section');
  if (footer) {
    tl.to(footer, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
    }, 0);
  }
  
  return tl;
}

// About page logic
export async function initAbout() {
  // Wait for fonts to load before any potential SplitText usage
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  
  // Store in state for cleanup
  setState('about', {
    playExitAnimation: () => playPageExitAnimation(),
  });
  
  // Play page enter animation
  playPageEnterAnimation();
  
  // Future: Add scroll animations or other interactions here
}

