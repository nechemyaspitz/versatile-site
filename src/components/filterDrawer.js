// Filter drawer (GSAP animations)
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
  
  // CRITICAL FIX: Move drawer to .page-wrapper (escape data-taxi-view stacking context)
  // This prevents parent transforms (from data-taxi-view, Lenis, etc.) 
  // from creating a stacking context that would break position: fixed
  const pageWrapper = document.querySelector('.page-wrapper');
  if (pageWrapper && drawer.parentElement !== pageWrapper) {
    console.log('📦 Moving .filter-drawer to .page-wrapper (was inside:', drawer.parentElement, ')');
    pageWrapper.appendChild(drawer);
  }

  // Clear any existing GSAP properties first (important for page revisits)
  gsap.set(drawer, { clearProps: 'all' });
  gsap.set(controls, { clearProps: 'all' });
  
  // Then set initial state
  gsap.set(drawer, { 
    display: 'none', 
    opacity: 0,
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 30
  });
  gsap.set(controls, { xPercent: 100 });

  if (openBtn) {
    openBtn.addEventListener(
      'click',
      () => {
        // Stop Lenis smooth scroll
        if (window.lenis) {
          window.lenis.stop();
        }
        
        // Ensure drawer is fixed and positioned correctly
        gsap.set(drawer, { 
          display: 'flex',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 30
        });
        
        // Animate in
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

  // Close drawer function (reusable)
  const closeDrawer = () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power1.inOut', duration: 0.1 },
      onComplete: () => {
        gsap.set(drawer, { display: 'none' });
        
        // Resume Lenis smooth scroll
        if (window.lenis) {
          window.lenis.start();
        }
      },
    });
    tl.to(controls, { xPercent: 100, ease: 'power4.in', duration: 0.2 }).to(
      drawer,
      { opacity: 0, duration: 0.05 },
      '-=0.1'
    );
  };
  
  // Close button click
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer, { signal: ac.signal });
  }
  
  // Click outside controls to close (click on drawer background)
  if (drawer) {
    drawer.addEventListener(
      'click',
      (e) => {
        // Only close if clicking directly on drawer (not on controls or their children)
        if (e.target === drawer) {
          closeDrawer();
        }
      },
      { signal: ac.signal }
    );
  }
}

