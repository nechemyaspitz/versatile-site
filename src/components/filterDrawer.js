// Filter drawer (GSAP animations)
import { stopLenis, startLenis } from '../utils/lenis.js';

export function setupFilterListeners() {
  setupFilterListeners._ac?.abort?.();
  const ac = new AbortController();
  setupFilterListeners._ac = ac;

  const openBtn = document.querySelector('#filters-open');
  const closeBtn = document.querySelector('.close-filters');
  const drawer = document.querySelector('.filter-drawer');
  const controls = document.querySelector('.filter-controls');

  if (!drawer || !controls) return;

  // GSAP required
  if (!window.gsap) return;

  // Clear any existing GSAP properties first (important for page revisits)
  gsap.set(drawer, { clearProps: 'all' });
  gsap.set(controls, { clearProps: 'all' });
  
  // Then set initial state
  gsap.set(drawer, { display: 'none', opacity: 0 });
  gsap.set(controls, { xPercent: 100 });

  if (openBtn) {
    openBtn.addEventListener(
      'click',
      () => {
        // Stop Lenis scrolling when drawer opens
        stopLenis();
        
        gsap.set(drawer, { display: 'flex' });
        const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' } });
        tl.to(drawer, { opacity: 1, duration: 0.1 }).to(
          controls,
          { xPercent: 0, ease: 'power4.out', duration: 0.4 },
          0.06
        );
      },
      { signal: ac.signal }
    );
  }

  if (closeBtn) {
    closeBtn.addEventListener(
      'click',
      () => {
        const tl = gsap.timeline({
          defaults: { ease: 'power1.inOut', duration: 0.1 },
          onComplete: () => {
            gsap.set(drawer, { display: 'none' });
            // Resume Lenis scrolling when drawer closes
            startLenis();
          },
        });
        tl.to(controls, { xPercent: 100, ease: 'power4.in', duration: 0.2 }).to(
          drawer,
          { opacity: 0, duration: 0.05 },
          '-=0.1'
        );
      },
      { signal: ac.signal }
    );
  }
}

