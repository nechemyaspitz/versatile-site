// Home page: Swiper + GSAP SplitText slider
import { loadScript, loadStyle } from '../utils/assetLoader.js';
import { setState } from '../core/state.js';
import { updateCurrentYear } from '../utils/currentYear.js';

export async function initHome(nsCtx) {
  // Wait for fonts to load before SplitText (prevents layout shift warnings)
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  
  // Update current year in footer
  updateCurrentYear();
  
  // Load Swiper (GSAP is already globally available)
  await loadStyle(
    'https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css'
  );
  if (!window.Swiper) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js'
    );
  }

  // If no swiper markup, skip
  const rootSwiper = document.querySelector('.swiper');
  if (!rootSwiper) {
    setState('home', { destroy: () => {} });
    return;
  }

  // Slider module
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const SLIDE_DUR = prefersReduced ? 0 : 1.45;
  const EASE = 'power4.inOut';
  const TEXT_IN_FRACTION = 0.3;
  const PARALLAX_X_PERCENT = 28;
  const AUTOPLAY_DELAY = 4.2;

  let wrapper = null;
  let tl = null;
  let autoplayTimer = null;
  let introPlayed = false;
  let currentX = 0;
  let exitAnimation = null;

  // Register GSAP plugins if available
  if (window.gsap && gsap.registerPlugin) {
    try {
      if (window.SplitText) gsap.registerPlugin(SplitText);
      if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    } catch (e) {}
  }
  
  // Store ScrollTrigger instances for cleanup
  let scrollTriggers = [];

  // ====== PAGE ENTER ANIMATION ======
  function playPageEnterAnimation(swiperInstance) {
    // 0. Reveal page immediately (hidden by CSS/transition to prevent FOUC)
    const view = document.querySelector('[data-taxi-view="home"]');
    if (view) {
      if (window.gsap) {
        gsap.set(view, { opacity: 1 });
      } else {
        // Fallback if GSAP not loaded yet
        view.style.opacity = '1';
      }
    }
    
    if (!window.gsap) return Promise.resolve();
    
    const enterTL = gsap.timeline();

    // 1. Hero heading: opacity 0→1, scale 0.8→1
    const heroHeading = document.querySelector('.hero-heading');
    if (heroHeading) {
      enterTL.fromTo(
        heroHeading,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.85,
          ease: 'expo.inOut',
          transformOrigin: 'top left',
        },
        0 // Start at 0s
      );
    }

    // 2. Button group children: y 102%→0%, stagger 0.045s
    const btnGroupChildren = document.querySelectorAll('.btn-group > *');
    if (btnGroupChildren.length > 0) {
      // Clear any CSS transforms first, then set GSAP initial state
      gsap.set(btnGroupChildren, { clearProps: 'transform' });
      gsap.set(btnGroupChildren, { yPercent: 102 });
      
      enterTL.to(
        btnGroupChildren,
        {
          yPercent: 0,
          duration: 0.85,
          ease: 'expo.inOut',
          stagger: 0.045,
        },
        0.09 // Start 0.09s into animation
      );
    }

    // 3. Hero cover: width 100%→0%
    const heroCover = document.querySelector('.hero-cover');
    if (heroCover) {
      enterTL.fromTo(
        heroCover,
        { width: '100%' },
        {
          width: '0%',
          duration: 0.85,
          ease: 'expo.inOut',
        },
        0.28 // Start 0.28s into animation
      );
    }

    // 4. Small premium text: split chars, opacity 0→1, stagger 0.017s
    const smPremium = document.querySelector('.sm-premium');
    if (smPremium && window.SplitText) {
      // Set parent to visible so we can see the chars animate
      gsap.set(smPremium, { opacity: 1 });
      
      const split = new SplitText(smPremium, { type: 'chars' });
      gsap.set(split.chars, { opacity: 0 });
      
      enterTL.to(
        split.chars,
        {
          opacity: 1,
          duration: 1.05,
          ease: 'power1.out',
          stagger: 0.017,
        },
        0.4 // Start 0.4s into animation
      );
    }

    // 5. Swiper: scale 1.1→1
    if (rootSwiper) {
      enterTL.fromTo(
        rootSwiper,
        { scale: 1.1 },
        {
          scale: 1,
          duration: 1.05,
          ease: 'expo.out',
        },
        0.42 // Start 0.42s into animation
      );
    }

    // 6. Slider text: animate in the first slide's text during page enter
    if (swiperInstance && !prefersReduced) {
      const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
      const split = splitOnce(activeSlide);
      if (split) {
        enterTL.to(
          split.chars,
          {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: { each: 0.02, from: 'start' },
          },
          0.8 // Start 0.8s into animation - during the page enter flow
        );
      }
    }

    // 7. Footer: fade in near end of animation
    const footer = document.querySelector('.footer-section');
    if (footer) {
      gsap.set(footer, { opacity: 0 });
      enterTL.to(
        footer,
        {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        0.9 // Start near end of animation
      );
    }

    return enterTL;
  }

  // ====== PAGE EXIT ANIMATION ======
  function playPageExitAnimation() {
    const exitTL = gsap.timeline();
    
    // Kill ScrollTriggers and reverse scroll animations
    killAndReverseScrollAnimations(exitTL);

    // 0. Footer: fade out immediately
    const footer = document.querySelector('.footer-section');
    if (footer) {
      exitTL.to(
        footer,
        {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        0 // Start immediately
      );
    }

    // Hero section exit animations:
    // 1. Small premium text: opacity 1→0, stagger chars 0.009s
    const smPremium = document.querySelector('.sm-premium');
    if (smPremium && window.SplitText) {
      const split = new SplitText(smPremium, { type: 'chars' });
      exitTL.fromTo(
        split.chars,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.65,
          ease: 'power1.out',
          stagger: 0.009,
        },
        0 // Start at 0s
      );
    }

    // 2. Hero heading: opacity 1→0, scale 1→0.8
    const heroHeading = document.querySelector('.hero-heading');
    if (heroHeading) {
      exitTL.fromTo(
        heroHeading,
        { opacity: 1, scale: 1 },
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: 'expo.inOut',
          transformOrigin: 'top left',
        },
        0 // Start at 0s
      );
    }

    // 3. Button group children: y 0%→102%, stagger 0.045s
    const btnGroupChildren = document.querySelectorAll('.btn-group > *');
    if (btnGroupChildren.length > 0) {
      exitTL.fromTo(
        btnGroupChildren,
        { yPercent: 0 },
        {
          yPercent: 102,
          duration: 0.8,
          ease: 'expo.inOut',
          stagger: 0.045,
        },
        0.05 // Start 0.05s into animation
      );
    }

    // 4. Hero cover: width 0%→100%
    const heroCover = document.querySelector('.hero-cover');
    if (heroCover) {
      exitTL.fromTo(
        heroCover,
        { width: '0%' },
        {
          width: '100%',
          duration: 0.8,
          ease: 'expo.inOut',
        },
        0.16 // Start 0.16s into animation
      );
    }

    // 5. Swiper: scale 1→0.5
    if (rootSwiper) {
      exitTL.fromTo(
        rootSwiper,
        { scale: 1 },
        {
          scale: 0.5,
          duration: 0.8,
          ease: 'expo.in',
        },
        0.16 // Start 0.16s into animation
      );
    }

    return exitTL;
  }

  // ====== SCROLL ANIMATIONS ======
  function setupScrollAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    // Kill any existing ScrollTriggers first
    scrollTriggers.forEach(trigger => trigger.kill());
    scrollTriggers = [];
    
    // Configure ScrollTrigger for better performance
    ScrollTrigger.config({
      limitCallbacks: true, // Limit callback frequency for better performance
      syncInterval: 150, // Reduce sync checks
    });
    
    // 1. Featured materials content: fade in
    const featuredContent = document.querySelector('.featured-materials-content');
    if (featuredContent) {
      // Create animation with GPU acceleration
      const anim = gsap.fromTo(featuredContent,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3,
          ease: 'power1.inOut',
          paused: true,
          force3D: true,
          willChange: 'opacity',
        }
      );
      
      const trigger = ScrollTrigger.create({
        trigger: featuredContent,
        start: '10% bottom',
        animation: anim,
        toggleActions: 'play none none reverse',
        fastScrollEnd: true, // Optimize for fast scrolling
      });
      scrollTriggers.push(trigger);
    }
    
    // 2. Featured materials grid: stagger fade in children
    const featuredGrid = document.querySelector('.featured-materials-grid');
    if (featuredGrid) {
      const gridChildren = gsap.utils.toArray(featuredGrid.children);
      if (gridChildren.length > 0) {
        const anim = gsap.fromTo(gridChildren,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power1.inOut',
            stagger: 0.1,
            paused: true,
            force3D: true,
            willChange: 'opacity',
          }
        );
        
        const trigger = ScrollTrigger.create({
          trigger: featuredGrid,
          start: 'top 90%',
          animation: anim,
          toggleActions: 'play none none reverse',
          fastScrollEnd: true,
        });
        scrollTriggers.push(trigger);
      }
    }
    
    // 3. Large text: split by words + chars, fade + slide in from right
    const txtLgElements = gsap.utils.toArray('.txt-lg');
    txtLgElements.forEach((txtLg) => {
      if (window.SplitText) {
        const split = new SplitText(txtLg, { type: 'words,chars' });
        
        const anim = gsap.fromTo(split.chars,
          { opacity: 0, x: 50 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power4.inOut',
            stagger: { amount: 0.15 },
            paused: true,
            force3D: true,
            willChange: 'opacity, transform',
          }
        );
        
        const trigger = ScrollTrigger.create({
          trigger: txtLg,
          start: 'bottom bottom',
          animation: anim,
          toggleActions: 'play none none reverse',
          fastScrollEnd: true,
        });
        scrollTriggers.push(trigger);
      }
    });
    
    // 4. Scroll buttons: slide up from 100%
    const btnScrollElements = gsap.utils.toArray('[data-btn-scroll]');
    btnScrollElements.forEach((btn) => {
      const anim = gsap.fromTo(btn,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.8,
          ease: 'power4.inOut',
          paused: true,
          force3D: true,
          willChange: 'transform',
        }
      );
      
      const trigger = ScrollTrigger.create({
        trigger: btn,
        start: 'bottom bottom',
        animation: anim,
        toggleActions: 'play none none reverse',
        fastScrollEnd: true,
      });
      scrollTriggers.push(trigger);
    });
    
    // Defer refresh to next frame to avoid jitter during setup
    requestAnimationFrame(() => {
      if (window.ScrollTrigger) {
        ScrollTrigger.refresh();
      }
    });
  }

  function killAndReverseScrollAnimations(exitTL) {
    if (!window.gsap) return;
    
    // Kill all ScrollTriggers
    scrollTriggers.forEach(trigger => trigger.kill());
    scrollTriggers = [];
    
    // Simple fade out with stagger - clean and elegant
    const featuredContent = document.querySelector('.featured-materials-content');
    if (featuredContent) {
      // Collect all animated children
      const allElements = [];
      
      // Add grid children
      const featuredGrid = featuredContent.querySelector('.featured-materials-grid');
      if (featuredGrid) {
        allElements.push(...gsap.utils.toArray(featuredGrid.children));
      }
      
      // Add text elements
      allElements.push(...gsap.utils.toArray(featuredContent.querySelectorAll('.txt-lg')));
      
      // Add buttons
      allElements.push(...gsap.utils.toArray(featuredContent.querySelectorAll('[data-btn-scroll]')));
      
      // Fade out all elements with a gentle stagger
      if (allElements.length > 0) {
        exitTL.to(allElements, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut',
          stagger: 0.03, // Gentle stagger
        }, 0);
      }
      
      // Fade out container last
      exitTL.to(featuredContent, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
      }, 0.2); // Slight delay
    }
  }

  function splitOnce(slide) {
    if (!slide || !window.SplitText) return null;
    if (slide.__split) return slide.__split;
    const titleEl = slide.querySelector('.slider-product-name');
    if (!titleEl) return null;
    const split = new SplitText(titleEl, { type: 'chars' });
    slide.__split = split;
    gsap.set(split.chars, {
      yPercent: 120,
      rotate: 6,
      opacity: 0,
      transformOrigin: '0% 100%',
      willChange: 'transform, opacity',
    });
    return split;
  }

  function hideText(slide) {
    const split = splitOnce(slide);
    if (!split) return;
    gsap.killTweensOf(split.chars);
    gsap.set(split.chars, { yPercent: 120, rotate: 6, opacity: 0 });
  }

  function animateTextIn(slide) {
    const split = splitOnce(slide);
    if (!split) return;
    gsap.killTweensOf(split.chars);
    gsap.to(split.chars, {
      yPercent: 0,
      rotate: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'power3.out',
      stagger: { each: 0.02, from: 'start' },
    });
  }

  function animateTextOut(slide) {
    const split = splitOnce(slide);
    if (!split) return;
    gsap.killTweensOf(split.chars);
    gsap.to(split.chars, {
      yPercent: -120,
      rotate: -4,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      stagger: { each: 0.015, from: 'end' },
      onComplete: () => {
        gsap.set(split.chars, { yPercent: 120, rotate: 6, opacity: 0 });
      },
    });
  }

  function getRealSlidesCount(sw) {
    let max = -1;
    sw.slides.forEach((s) => {
      const idx = parseInt(
        s.getAttribute('data-swiper-slide-index') || '0',
        10
      );
      if (!Number.isNaN(idx) && idx > max) max = idx;
    });
    return max + 1;
  }

  function targetTranslateXByIndex(sw, slideIndex) {
    const s = sw.slides[slideIndex];
    const offset = s.swiperSlideOffset || 0;
    return sw.rtlTranslate ? offset : -offset;
  }

  function closestDuplicateIndex(sw, realIndex, fromX) {
    let bestIdx = -1;
    let bestDelta = Infinity;
    sw.slides.forEach((s, i) => {
      const real = parseInt(
        s.getAttribute('data-swiper-slide-index') || '-1',
        10
      );
      if (real !== realIndex) return;
      const toX = targetTranslateXByIndex(sw, i);
      const d = Math.abs(toX - fromX);
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

  function updateParallax(sw, x) {
    if (prefersReduced) return;
    sw.setTranslate(x);
    sw.slides.forEach((slide) => {
      const img = slide.querySelector('.slider-img');
      if (!img) return;
      const p = typeof slide.progress === 'number' ? slide.progress : 0;
      gsap.set(img, { xPercent: p * PARALLAX_X_PERCENT });
    });
  }

  function introFirstSlide(sw) {
    if (introPlayed || prefersReduced) return;
    const active = sw.slides[sw.activeIndex];
    // No intro animation - just show the text
    animateTextIn(active);
    introPlayed = true;
  }

  function clearAutoplay() {
    if (autoplayTimer) {
      autoplayTimer.kill();
      autoplayTimer = null;
    }
  }
  function scheduleAutoplay(nextFn) {
    clearAutoplay();
    if (prefersReduced) return;
    autoplayTimer = gsap.delayedCall(AUTOPLAY_DELAY, nextFn);
  }

  function transitionTo(sw, dirOrReal = 'next') {
    if (!wrapper) return;

    clearAutoplay();
    if (tl) {
      tl.kill();
      tl = null;
    }

    const realCount = getRealSlidesCount(sw);
    const prevIdx = sw.activeIndex;
    const prevSlide = sw.slides[prevIdx];

    let targetReal;
    if (dirOrReal === 'next') {
      targetReal = (sw.realIndex + 1) % realCount;
    } else if (dirOrReal === 'prev') {
      targetReal = (sw.realIndex - 1 + realCount) % realCount;
    } else if (typeof dirOrReal === 'number') {
      targetReal = ((dirOrReal % realCount) + realCount) % realCount;
    } else {
      targetReal = (sw.realIndex + 1) % realCount;
    }

    sw.updateSlides();
    sw.updateSlidesOffset();

    const bestDupIndex = closestDuplicateIndex(sw, targetReal, currentX);
    sw.slideTo(bestDupIndex, 0, false);
    sw.updateSlides();
    sw.updateSlidesOffset();

    const curIdx = sw.activeIndex;
    const curSlide = sw.slides[curIdx];

    const fromX = currentX;
    let toX = targetTranslateXByIndex(sw, curIdx);

    if (fromX === toX) {
      const sign = sw.rtlTranslate ? -1 : 1;
      toX = toX - sign * sw.width;
    }

    tl = gsap.timeline({
      onUpdate: () => {
        const x = gsap.getProperty(wrapper, 'x');
        updateParallax(sw, x);
      },
      onComplete: () => {
        currentX = toX;
        scheduleAutoplay(() => transitionTo(sw, 'next'));
      },
    });

    animateTextOut(prevSlide);
    hideText(curSlide);

    tl.fromTo(
      wrapper,
      { x: fromX },
      { x: toX, duration: SLIDE_DUR, ease: EASE },
      0
    );
    tl.add(() => animateTextIn(curSlide), SLIDE_DUR * TEXT_IN_FRACTION);
  }

  // Initialize swiper first (before enter animation so we can access the active slide)
  const swiper = new Swiper('.swiper', {
    loop: true,
    slidesPerView: 1,
    allowTouchMove: false,
    speed: 0,
    virtualTranslate: true,
    watchSlidesProgress: true,
    on: {
      init(sw) {
        wrapper = sw.el.querySelector('.swiper-wrapper');
        sw.slides.forEach(splitOnce);
        sw.updateSlides();
        sw.updateSlidesOffset();
        currentX = targetTranslateXByIndex(sw, sw.activeIndex);
        gsap.set(wrapper, {
          x: currentX,
          willChange: 'transform',
          force3D: true,
        });
        updateParallax(sw, currentX);
        
        // Play page enter animation (includes slider text)
        const enterAnimation = playPageEnterAnimation(sw);
        
        // Wait for enter animation to complete before starting autoplay
        enterAnimation.then(() => {
          introPlayed = true; // Mark as played
          scheduleAutoplay(() => transitionTo(sw, 'next'));
        });
      },
      resize(sw) {
        sw.updateSlides();
        sw.updateSlidesOffset();
        currentX = targetTranslateXByIndex(sw, sw.activeIndex);
        gsap.set(wrapper, { x: currentX });
        updateParallax(sw, currentX);
      },
    },
  });

  const onVisChange = () => {
    if (document.hidden) clearAutoplay();
    else scheduleAutoplay(() => transitionTo(swiper, 'next'));
  };
  document.addEventListener('visibilitychange', onVisChange);

  setState('home', {
    setupScrollAnimations: () => {
      // Re-setup scroll animations (useful when returning to page)
      setupScrollAnimations();
    },
    playExitAnimation: () => {
      // Play exit animation and return the timeline
      exitAnimation = playPageExitAnimation();
      return exitAnimation;
    },
    destroy: () => {
      try {
        document.removeEventListener('visibilitychange', onVisChange);
      } catch (e) {}
      try {
        clearAutoplay();
      } catch (e) {}
      try {
        tl?.kill?.();
      } catch (e) {}
      try {
        swiper?.destroy?.(true, true);
      } catch (e) {}
      try {
        enterAnimation?.kill?.();
      } catch (e) {}
      try {
        exitAnimation?.kill?.();
      } catch (e) {}
      try {
        // Clean up ScrollTriggers
        scrollTriggers.forEach(trigger => trigger.kill());
        scrollTriggers = [];
      } catch (e) {}
    },
  });
}

