import { setState } from '../core/state.js';

// Page enter animation
function playPageEnterAnimation() {
  // 0. Reveal page immediately (hidden by CSS/transition to prevent FOUC)
  const view = document.querySelector('[data-taxi-view="contact"]');
  if (view) {
    if (window.gsap) {
      gsap.set(view, { opacity: 1 });
    } else {
      // Fallback if GSAP not loaded yet
      view.style.opacity = '1';
    }
  }
  
  // Future: Add enter animations here (fade in, slide up, etc.)
}

// Page exit animation
function playPageExitAnimation() {
  // Future: Add exit animations here
  return Promise.resolve();
}

// Contact page logic
export async function initContact() {
  // Wait for fonts to load before any potential SplitText usage
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  
  // Store in state for cleanup
  setState('contact', {
    playExitAnimation: () => playPageExitAnimation(),
  });
  
  // Play page enter animation
  playPageEnterAnimation();
  
  // Future: Add form handling, animations, or other interactions here
}

