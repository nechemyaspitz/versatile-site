// Home page: Swiper + GSAP SplitText slider
import { loadScript, loadStyle } from '../utils/assetLoader.js';
import { setState } from '../core/state.js';

export async function initHome(nsCtx) {
  // Load assets
  if (!window.gsap) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'
    );
  }
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

  // SplitText is a Club plugin; only register if available
  if (window.SplitText && window.gsap && gsap.registerPlugin) {
    try {
      gsap.registerPlugin(SplitText);
    } catch (e) {}
  }

  // ====== PAGE ENTER ANIMATION ======
  function playPageEnterAnimation() {
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
          duration: 1,
          ease: 'expo.inOut',
          transformOrigin: 'top left',
        },
        0 // Start at 0s
      );
    }

    // 2. Button group children: y 102%→0%, stagger 0.05s
    const btnGroupChildren = document.querySelectorAll('.btn-group > *');
    if (btnGroupChildren.length > 0) {
      enterTL.fromTo(
        btnGroupChildren,
        { yPercent: 102 },
        {
          yPercent: 0,
          duration: 1,
          ease: 'expo.inOut',
          stagger: 0.05,
        },
        0.1 // Start 0.1s into animation
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
          duration: 1,
          ease: 'expo.inOut',
        },
        0.34 // Start 0.34s into animation
      );
    }

    // 4. Small premium text: split chars, opacity 0→1, stagger 0.02s
    const smPremium = document.querySelector('.sm-premium');
    if (smPremium && window.SplitText) {
      const split = new SplitText(smPremium, { type: 'chars' });
      enterTL.fromTo(
        split.chars,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.27,
          ease: 'power1.out',
          stagger: 0.02,
        },
        0.47 // Start 0.47s into animation
      );
    }

    // 5. Swiper: scale 1.1→1
    if (rootSwiper) {
      enterTL.fromTo(
        rootSwiper,
        { scale: 1.1 },
        {
          scale: 1,
          duration: 1.25,
          ease: 'expo.out',
        },
        0.5 // Start 0.5s into animation
      );
    }

    return enterTL;
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

  // Play page enter animation first
  const enterAnimation = playPageEnterAnimation();

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
        
        // Wait for enter animation to complete before starting slider
        enterAnimation.then(() => {
          introFirstSlide(sw);
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

  const onEnter = () => clearAutoplay();
  const onLeave = () =>
    scheduleAutoplay(() => transitionTo(swiper, 'next'));
  rootSwiper.addEventListener('mouseenter', onEnter);
  rootSwiper.addEventListener('mouseleave', onLeave);

  setState('home', {
    destroy: () => {
      try {
        document.removeEventListener('visibilitychange', onVisChange);
        rootSwiper.removeEventListener('mouseenter', onEnter);
        rootSwiper.removeEventListener('mouseleave', onLeave);
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
    },
  });
}

