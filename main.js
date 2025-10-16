(function () {
  'use strict';

  // Webflow interactions re-initialization
  const reinitWebflow = () => {
    if (window.Webflow && window.Webflow.require) {
      try {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
      } catch (e) {
        // no-op
      }
    }
  };

  // Persistent navigation
  const NAV_STATUS_SEL = '[data-navigation-status]';
  const NAV_TOGGLE_SEL = '[data-navigation-toggle="toggle"]';
  const NAV_CLOSE_SEL = '[data-navigation-toggle="close"]';
  const NAV_LINK_SEL = '[data-navigation] a[href]:not([target="_blank"]):not([data-no-barba])';

  function navEl() {
    return document.querySelector(NAV_STATUS_SEL);
  }

  function closeNav(skipScrollRestore = false) {
    const el = navEl();
    if (el) {
      el.setAttribute('data-navigation-status', 'not-active');
    }
  }

  function toggleNav() {
    const el = navEl();
    if (!el) return;
    const isActive = el.getAttribute('data-navigation-status') === 'active';
    el.setAttribute('data-navigation-status', isActive ? 'not-active' : 'active');
  }

  function updateActiveNavLinks(pathname = location.pathname) {
    let links = document.querySelectorAll(NAV_LINK_SEL);
    
    if (links.length === 0) {
      links = document.querySelectorAll('.hamburger-nav a[href]:not([target="_blank"])');
    }
    
    if (links.length === 0) {
      links = document.querySelectorAll('nav a[href]:not([target="_blank"]):not([data-taxi-ignore])');
    }
    
    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      try {
        const url = new URL(href, location.origin);
        const isActive = url.pathname === pathname;
        a.classList.toggle('w--current', isActive);
        if (isActive) {
          a.setAttribute('aria-current', 'page');
        } else {
          a.removeAttribute('aria-current');
        }
      } catch (e) {
        // Invalid URL, skip
      }
    });
  }

  function initScalingHamburgerNavigation() {
    initScalingHamburgerNavigation._ac?.abort?.();
    const ac = new AbortController();
    initScalingHamburgerNavigation._ac = ac;

    document.querySelectorAll(NAV_TOGGLE_SEL).forEach((btn) => {
      btn.addEventListener('click', toggleNav, { signal: ac.signal });
    });
    
    document.querySelectorAll(NAV_CLOSE_SEL).forEach((btn) => {
      btn.addEventListener('click', closeNav, { signal: ac.signal });
    });

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') closeNav();
      },
      { signal: ac.signal }
    );

    document.querySelectorAll(NAV_LINK_SEL).forEach((a) => {
      a.addEventListener('click', () => closeNav(true), { signal: ac.signal });
    });
  }

  // Default renderer - base class for all pages
  function createDefaultRenderer() {
    if (!window.taxi) {
      console.error('taxi not loaded!');
      return class {};
    }
    
    return class DefaultRenderer extends window.taxi.Renderer {
      initialLoad() {
        this.onEnter();
        this.onEnterCompleted();
      }
      
      onEnter() {
        // Override in child renderers
      }
      
      onEnterCompleted() {
        // Override in child renderers
      }
      
      onLeave() {
        // Override in child renderers
      }
      
      onLeaveCompleted() {
        // Override in child renderers
      }
    };
  }

  // Asset loader with deduplication
  const loadedAssets = new Set();

  const loadScript = (src, attrs = {}) => {
    if (loadedAssets.has(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
      s.onload = () => {
        loadedAssets.add(src);
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  };

  const loadStyle = (href) => {
    if (loadedAssets.has(href)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.onload = () => {
        loadedAssets.add(href);
        resolve();
      };
      l.onerror = reject;
      document.head.appendChild(l);
    });
  };

  // Page state management
  const PageState = new Map();

  const setState = (ns, obj) => PageState.set(ns, obj);
  const getState = (ns) => PageState.get(ns) || {};

  // Home page: Swiper + GSAP SplitText slider

  async function initHome(nsCtx) {
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
    let currentX = 0;
    let exitAnimation = null;

    // SplitText is a Club plugin; only register if available
    if (window.SplitText && window.gsap && gsap.registerPlugin) {
      try {
        gsap.registerPlugin(SplitText);
      } catch (e) {}
    }

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

      return enterTL;
    }

    // ====== PAGE EXIT ANIMATION ======
    function playPageExitAnimation() {
      const exitTL = gsap.timeline();

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
      },
    });
  }

  // Home page renderer

  function createHomeRenderer() {
    const DefaultRenderer = createDefaultRenderer();
    
    return class HomeRenderer extends DefaultRenderer {
      initialLoad() {
        initHome();
        this.onEnter();
        this.onEnterCompleted();
      }
      
      async onEnter() {
        await initHome();
      }
    };
  }

  /**
   * CollectionState.js
   * Pure state management for collections page
   * No DOM, no API, just state
   */

  class CollectionState {
    constructor() {
      // Items
      this.allLoadedItems = [];
      this.totalItems = 0;
      
      // Filters
      this.activeFilters = {};
      this.currentSort = 'recommended';
      
      // Pagination
      this.currentPage = 1;
      this.itemsPerPage = 10;
      this.hasMorePages = true;
      
      // Scroll restoration
      this.clickedProductId = null;
    }
    
    // ===== GETTERS =====
    
    getItems() {
      return this.allLoadedItems;
    }
    
    getTotalItems() {
      return this.totalItems;
    }
    
    getActiveFilters() {
      return this.activeFilters;
    }
    
    getCurrentSort() {
      return this.currentSort;
    }
    
    getCurrentPage() {
      return this.currentPage;
    }
    
    hasFilters() {
      return Object.values(this.activeFilters).some(
        filterValues => Array.isArray(filterValues) && filterValues.length > 0
      );
    }
    
    // ===== SETTERS =====
    
    setItems(items) {
      this.allLoadedItems = [...items];
    }
    
    appendItems(items) {
      this.allLoadedItems.push(...items);
    }
    
    setTotalItems(total) {
      this.totalItems = total;
    }
    
    setActiveFilters(filters) {
      this.activeFilters = { ...filters };
    }
    
    setCurrentSort(sort) {
      this.currentSort = sort;
    }
    
    setCurrentPage(page) {
      this.currentPage = page;
    }
    
    incrementPage() {
      this.currentPage++;
    }
    
    setHasMorePages(hasMore) {
      this.hasMorePages = hasMore;
    }
    
    setClickedProductId(id) {
      this.clickedProductId = id;
    }
    
    // ===== RESET =====
    
    reset() {
      this.allLoadedItems = [];
      this.currentPage = 1;
      this.hasMorePages = true;
    }
    
    // ===== SERIALIZATION =====
    
    toJSON() {
      return {
        allLoadedItems: this.allLoadedItems,
        totalItems: this.totalItems,
        activeFilters: this.activeFilters,
        currentSort: this.currentSort,
        currentPage: this.currentPage,
        hasMorePages: this.hasMorePages,
        clickedProductId: this.clickedProductId,
      };
    }
    
    fromJSON(data) {
      if (!data) return;
      
      this.allLoadedItems = data.allLoadedItems || [];
      this.totalItems = data.totalItems || 0;
      this.activeFilters = data.activeFilters || {};
      this.currentSort = data.currentSort || 'recommended';
      this.currentPage = data.currentPage || 1;
      this.hasMorePages = data.hasMorePages !== undefined ? data.hasMorePages : true;
      this.clickedProductId = data.clickedProductId || null;
    }
  }

  /**
   * CollectionCache.js
   * Handles sessionStorage caching with URL-based keys
   * Each unique URL state gets its own cache entry
   */

  class CollectionCache {
    constructor() {
      this.cacheExpiration = 300000; // 5 minutes
      console.log('💾 CollectionCache initialized');
    }
    
    /**
     * Generate cache key from URL or state
     * Each filter/sort combo gets a unique key
     * @param {Object} state - Optional CollectionState to generate key from
     */
    getCacheKey(state = null) {
      let params;
      
      if (state) {
        // Generate key from STATE (for saving)
        params = new URLSearchParams();
        
        // Add filters
        const activeFilters = state.getActiveFilters();
        Object.entries(activeFilters).forEach(([key, values]) => {
          if (values && values.length > 0) {
            params.set(key, values.join(','));
          }
        });
        
        // Add sort (if not default)
        const sort = state.getCurrentSort();
        if (sort && sort !== 'recommended') {
          params.set('sort', sort);
        }
      } else {
        // Generate key from URL (for loading)
        params = new URLSearchParams(window.location.search);
        
        // Remove pagination/config params (we cache all loaded items)
        params.delete('page');
        params.delete('limit');
        params.delete('config');
        params.delete('collection_id');
      }
      
      // Sort params alphabetically for consistent keys
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => `${key}=${val}`)
        .join('&');
      
      return `collections_${sortedParams || 'default'}`;
    }
    
    /**
     * Save state to sessionStorage
     * BUG FIX: Generate cache key from STATE, not URL (URL might not be updated yet)
     */
    save(state) {
      try {
        const cacheKey = this.getCacheKey(state);
        const data = {
          ...state.toJSON(),
          timestamp: Date.now()
        };
        
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        
        console.log(`  💾 Saved to cache: "${cacheKey}"`);
        console.log(`     Items: ${data.allLoadedItems.length}/${data.totalItems}`);
        console.log(`     Filters:`, JSON.stringify(data.activeFilters));
        
        return true;
      } catch (error) {
        console.error('Failed to save to cache:', error);
        return false;
      }
    }
    
    /**
     * Restore state from sessionStorage
     * Returns null if no cache, expired, or invalid
     * @param {boolean} isBackButton - Whether this is a back button navigation
     * @param {Object} state - Optional state to generate key from (instead of URL)
     */
    restore(isBackButton = false, state = null) {
      try {
        const cacheKey = this.getCacheKey(state);
        console.log(`  🔑 Cache key: "${cacheKey}"${state ? ' (from state)' : ' (from URL)'}`);
        
        const saved = sessionStorage.getItem(cacheKey);
        if (!saved) {
          console.log('  ❌ No cache found for this URL state');
          return null;
        }
        
        const data = JSON.parse(saved);
        const now = Date.now();
        const age = now - data.timestamp;
        
        console.log(`  📦 Cache found: age=${Math.round(age / 1000)}s, items=${data.allLoadedItems?.length || 0}/${data.totalItems}`);
        
        // Check expiration
        if (age > this.cacheExpiration) {
          console.log('  ⏰ Cache expired (>5min)');
          sessionStorage.removeItem(cacheKey);
          return null;
        }
        
        // Validate data
        if (!data.allLoadedItems || data.allLoadedItems.length === 0) {
          console.log('  ⚠️ Cache has no items');
          return null;
        }
        
        // Handle clicked product restoration (only for back button)
        if (!isBackButton) {
          data.clickedProductId = null;
        }
        
        console.log(`  ✅ Restoring ${data.allLoadedItems.length}/${data.totalItems} items from cache`);
        
        return data;
      } catch (error) {
        console.error('Failed to restore from cache:', error);
        const cacheKey = this.getCacheKey();
        sessionStorage.removeItem(cacheKey);
        return null;
      }
    }
    
    /**
     * Clear cache for current URL state
     */
    clear() {
      const cacheKey = this.getCacheKey();
      sessionStorage.removeItem(cacheKey);
      console.log(`  🗑️ Cleared cache: "${cacheKey}"`);
    }
    
    /**
     * Clear all collections caches
     */
    clearAll() {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('collections_')) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => sessionStorage.removeItem(key));
      console.log(`  🗑️ Cleared ${keys.length} cache entries`);
    }
  }

  /**
   * CollectionAPI.js
   * Handles all API interactions
   * No DOM, no state updates, just fetch and transform data
   */

  class CollectionAPI {
    constructor(collectionId = 'c09bba8e-4a81-49c2-b722-f1fa46c75861') {
      this.collectionId = collectionId;
      this.baseUrl = 'https://wmkcwljhyweqzjivbupx.supabase.co/functions/v1/generic-collection-filter';
      this.abortController = null;
      this.responseCache = new Map(); // API response cache (different from session cache)
      
      console.log('🌐 CollectionAPI initialized');
    }
    
    /**
     * Build request URL with filters, sort, and pagination
     */
    buildRequestUrl(state) {
      const params = new URLSearchParams({
        collection_id: this.collectionId,
        page: state.getCurrentPage().toString(),
        limit: state.itemsPerPage.toString(),
        sort: state.getCurrentSort(),
      });

      // Add active filters to URL
      Object.entries(state.getActiveFilters()).forEach(
        ([filterType, filterValues]) => {
          if (filterValues.length > 0) {
            const variantFilters = ['colors', 'color', 'size', 'finish'];
            const mainProductMapping = {
              application: 'application-slugs',
              material: 'material',
              featured: 'featured',
              thickness: 'thickness',
            };
            
            if (variantFilters.includes(filterType)) {
              params.set(`filter_${filterType}`, filterValues.join(','));
            } else {
              const backendField = mainProductMapping[filterType] || filterType;
              params.set(`filter_${backendField}`, filterValues.join(','));
            }
          }
        }
      );

      // Add config
      const config = {
        searchFields: ['name', 'description', 'actual-product-name'],
        sortFields: {
          'a-z': 'name:asc',
          'z-a': 'name:desc',
          recommended: 'sort-order:asc',
          featured: 'featured:desc',
        },
        relatedItems: { enabled: true, relationField: 'variants' },
        relatedItemFields: ['colors', 'color', 'size', 'finish'],
        customFilters: {
          'application-slugs': { type: 'ilike' },
          material: { type: 'exact' },
          featured: { type: 'boolean' },
          thickness: { type: 'numeric' },
          color: { type: 'exact' },
          colors: { type: 'exact' },
          size: { type: 'array_contains' },
          finish: { type: 'array_contains' },
        },
      };

      params.set('config', JSON.stringify(config));
      return `${this.baseUrl}?${params.toString()}`;
    }
    
    /**
     * Fetch items from API
     * Returns { items, pagination } or throws error
     */
    async fetchItems(state) {
      const url = this.buildRequestUrl(state);
      
      console.log('%c[API] Fetching items...', 'color: #00aaff');
      console.log('  URL:', url);
      console.log('  Page:', state.getCurrentPage());
      console.log('  Filters:', JSON.stringify(state.getActiveFilters()));
      
      // Check response cache
      if (this.responseCache.has(url)) {
        console.log('  ✅ Using cached API response');
        return this.responseCache.get(url);
      }
      
      // Cancel previous request if still pending
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();
      
      try {
        const response = await fetch(url, { 
          signal: this.abortController.signal 
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied. Please contact support.');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text:', text);
          throw new Error('Invalid response format from server');
        }
        
        // Cache the response
        this.responseCache.set(url, data);
        
        console.log(`  ✅ Fetched ${data.items?.length || 0} items`);
        console.log(`  Total items: ${data.pagination?.total || 0}`);
        
        return data;
      } catch (error) {
        // Don't log abort errors (they're intentional)
        if (error.name !== 'AbortError') {
          console.error('[API] Fetch error:', error);
          throw error;
        }
        throw error;
      }
    }
    
    /**
     * Clear response cache
     */
    clearCache() {
      this.responseCache.clear();
      console.log('  🗑️ Cleared API response cache');
    }
  }

  /**
   * CollectionRenderer.js
   * Handles all DOM rendering and animations
   * Creates elements, manages skeletons, animates items
   */

  class CollectionRenderer {
    constructor(containerSelector) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        console.error(`Container not found: ${containerSelector}`);
        console.log('Available containers:', {
          productGrid: document.querySelector('.product-grid'),
          collectionList: document.querySelector('.collection_product-list'),
        });
        throw new Error(`Container not found: ${containerSelector}`);
      }
      
      console.log('🎨 CollectionRenderer initialized');
    }
    
    // ===== MAIN RENDERING =====
    
    /**
     * Render items (replaces all content)
     */
    async renderItems(items, fromCache = false) {
      console.log('%c[RENDER] Rendering items', 'color: #9900ff');
      console.log(`  Items: ${items.length}, fromCache: ${fromCache}`);
      
      // Check for skeleton loaders
      const hasSkeletons = this.container.querySelectorAll('.skeleton-item').length > 0;
      
      if (hasSkeletons) {
        // Fade out skeletons first
        await this.removeSkeletonLoaders(true);
      }
      
      // Clear and render
      this.container.innerHTML = '';
      const fragment = document.createDocumentFragment();
      
      items.forEach(item => {
        const el = this.createProductElement(item);
        fragment.appendChild(el);
      });
      
      this.container.appendChild(fragment);
      
      // Animate items in
      const itemElements = this.container.querySelectorAll('.collection_grid-item');
      this.animateItemsIn(itemElements);
      
      // Wait for images to load
      this.waitForImagesToLoad(this.container.querySelectorAll('img'));
    }
    
    /**
     * Append items (adds to existing content)
     */
    async appendItems(items) {
      console.log('%c[RENDER] Appending items', 'color: #9900ff');
      console.log(`  Items: ${items.length}`);
      
      // Fade out skeletons if any
      await this.removeSkeletonLoaders(true);
      
      const fragment = document.createDocumentFragment();
      items.forEach(item => {
        const el = this.createProductElement(item);
        fragment.appendChild(el);
      });
      
      this.container.appendChild(fragment);
      
      // Animate new items
      const allItems = Array.from(this.container.querySelectorAll('.collection_grid-item'));
      const newItems = allItems.slice(-items.length);
      this.animateItemsIn(newItems);
      
      // Wait for new images
      const allImages = Array.from(this.container.querySelectorAll('img'));
      const newImages = allImages.slice(-items.length * 4);
      this.waitForImagesToLoad(newImages);
    }
    
    /**
     * Clear all items
     */
    clear() {
      this.container.innerHTML = '';
    }
    
    // ===== PRODUCT ELEMENT CREATION =====
    
    createProductElement(item) {
      const productName = item.name || item['actual-product-name'] || 'Untitled';
      const mainImage = item.image?.url || 'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
      const productSlug = item.slug || item.webflow_item_id || '';
      const baseUrl = `/collections/${productSlug}`;

      const productItem = document.createElement('div');
      productItem.setAttribute('role', 'listitem');
      productItem.className = 'w-dyn-item';

      productItem.innerHTML = `
      <div class="collection_grid-item" data-base-url="${baseUrl}" data-product-id="${baseUrl}" data-hover-initialized="false">
        <a href="${baseUrl}" class="collection_image-cover">
          <img src="${mainImage}" loading="lazy" alt="${productName}" class="img-2" data-original-src="${mainImage}">
        </a>
        <div class="progressive-blur">
            <div class="blur"></div>
        </div>
        <div class="gradient-cover"></div>
        <div class="collection-overlay">
          <a href="${baseUrl}" class="collection_details">
            <div class="truncate">${productName}</div>
          </a>
          ${this.createProductMetaHTML(item)}
          ${this.createVariantThumbnailsHTML(item.related_items, baseUrl)}
        </div>
      </div>
    `;
      return productItem;
    }

    createProductMetaHTML(item) {
      const thickness = item.thickness || '';
      const applications = item['application-slugs'] || '';
      const material = item.material || '';
      const isFeatured = item.featured || false;
      return `
      <div data-thickness="${thickness}" data-applications="${applications}" data-material="${material}" class="product-meta">
        ${isFeatured ? '<div class="is-featured-flag"></div>' : ''}
      </div>
    `;
    }

    createVariantThumbnailsHTML(relatedItems, baseUrl) {
      if (!relatedItems || relatedItems.length === 0) {
        return `
        <div class="collection-list-wrapper w-dyn-list">
          <div role="list" class="variant_thumbnail-list w-dyn-items"></div>
        </div>
      `;
      }
      
      const variantHTML = relatedItems
        .map((variant) => {
          const imageSrc = variant['image-3']?.url || 'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
          const finishes = variant['finish-slugs'] || '';
          const color = this.extractColorName(variant.color, variant.slug);
          const sizes = variant['size-slugs'] || '';
          const name = variant.name || variant.slug || variant.webflow_item_id || '';
          const variantSlug = variant.slug || variant.webflow_item_id || '';
          const variantUrl = variantSlug ? `${baseUrl}?variant=${variantSlug}` : baseUrl;
          
          return `
          <div role="listitem" class="w-dyn-item">
            <a href="${variantUrl}" class="variant-thumb-link" style="display: block; line-height: 0;">
              <img src="${imageSrc}" loading="lazy" alt="${name}" class="variant-thumb" style="cursor: pointer;">
            </a>
            <div data-finishes="${finishes}" data-name="${name}" data-slug="${variantSlug}" data-color="${color}" data-sizes="${sizes}" class="variant-meta"></div>
          </div>
        `;
        })
        .join('');

      return `
      <div class="collection-list-wrapper w-dyn-list">
        <div role="list" class="variant_thumbnail-list w-dyn-items">
          ${variantHTML}
        </div>
      </div>
    `;
    }

    extractColorName(colorString, slug) {
      if (!colorString) return slug || '';
      const cleaned = colorString.replace(/\s*\(.*?\)\s*/g, '').trim();
      return cleaned || slug || '';
    }
    
    // ===== SKELETON LOADERS =====
    
    showSkeletonLoaders(count) {
      console.log(`  💀 Showing ${count} skeleton loaders`);
      
      for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-item collection_grid-item';
        skeleton.style.cssText = `
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 2.5s infinite;
        min-height: 300px;
        opacity: 0;
      `;
        
        this.container.appendChild(skeleton);
      }
      
      // Animate skeletons in
      if (window.gsap) {
        const skeletons = this.container.querySelectorAll('.skeleton-item');
        gsap.to(skeletons, {
          opacity: 0.6,
          duration: 0.3,
          ease: 'power2.out',
          stagger: 0.05,
        });
      } else {
        // Fallback without GSAP
        const skeletons = this.container.querySelectorAll('.skeleton-item');
        skeletons.forEach((s, i) => {
          setTimeout(() => s.style.opacity = '0.6', i * 50);
        });
      }
    }
    
    async removeSkeletonLoaders(animate = false) {
      const skeletons = this.container.querySelectorAll('.skeleton-item');
      if (skeletons.length === 0) return Promise.resolve();
      
      if (!animate || !window.gsap) {
        skeletons.forEach(s => s.remove());
        return Promise.resolve();
      }
      
      // Fade out with GSAP
      return new Promise(resolve => {
        gsap.to(skeletons, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            skeletons.forEach(s => s.remove());
            resolve();
          }
        });
      });
    }
    
    // ===== ANIMATIONS =====
    
    animateItemsIn(items) {
      if (!window.gsap || !items || items.length === 0) return;
      
      // Set initial state
      gsap.set(items, {
        opacity: 0,
        y: 20,
      });
      
      // Animate in with stagger
      requestAnimationFrame(() => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.025,
          delay: 0.15,
        });
      });
    }
    
    // ===== IMAGE LOADING =====
    
    waitForImagesToLoad(images) {
      if (!images || images.length === 0) return;
      
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        });
      });
      
      Promise.all(imagePromises).then(() => {
        // Resize Lenis if available
        if (window.lenis) {
          window.lenis.resize();
        }
        console.log('  📸 All images loaded, Lenis resized');
      });
    }
  }

  /**
   * CollectionInfiniteScroll.js
   * Manages infinite scroll using IntersectionObserver
   */

  class CollectionInfiniteScroll {
    constructor(containerSelector, callback) {
      this.container = document.querySelector(containerSelector);
      this.callback = callback;
      this.observer = null;
      this.sentinel = null;
      
      if (!this.container) {
        throw new Error(`Container not found: ${containerSelector}`);
      }
      
      console.log('♾️  CollectionInfiniteScroll initialized');
    }
    
    /**
     * Initialize infinite scroll observer
     */
    init() {
      // Remove old sentinel if exists
      if (this.sentinel) {
        this.sentinel.remove();
      }
      
      // Create sentinel element
      this.sentinel = document.createElement('div');
      this.sentinel.className = 'infinite-scroll-sentinel';
      this.sentinel.style.cssText = 'height: 1px; width: 100%; clear: both;';
      
      // Place sentinel right after the container
      this.container.after(this.sentinel);
      
      // Create observer
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              console.log('  ♾️  Sentinel visible - loading more items');
              this.callback();
            }
          });
        },
        {
          root: null, // viewport
          rootMargin: '200px', // Start loading before reaching bottom
          threshold: 0,
        }
      );
      
      this.observer.observe(this.sentinel);
      console.log('  ♾️  Observer attached to sentinel');
    }
    
    /**
     * Destroy observer and sentinel
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      if (this.sentinel) {
        this.sentinel.remove();
        this.sentinel = null;
      }
      
      console.log('  ♾️  Infinite scroll destroyed');
    }
  }

  /**
   * CollectionInteractions.js
   * Handles all user interactions: filters, sorting, image hover, NiceSelect
   */

  class CollectionInteractions {
    constructor(page) {
      this.page = page; // Reference to CollectionsPage
      this.filterForm = document.getElementById('filters');
      this.sortDropdown = document.getElementById('sort-select');
      this.clearButton = document.querySelector('.button.alt');
      this.productContainer = document.querySelector('.product-grid');
      this.niceSelect = null;
      this._ac = new AbortController();
      
      console.log('🎮 CollectionInteractions initialized');
    }
    
    /**
     * Initialize all interactions
     */
    init() {
      // Try to initialize NiceSelect immediately
      this.initNiceSelect();
      
      // Retry after a short delay if it failed (library might not be loaded yet)
      if (!this.niceSelect) {
        setTimeout(() => {
          this.initNiceSelect();
        }, 500);
      }
      
      this.initEventListeners();
      this.initFilterChipEvents();
      this.setupProductClickTracking();
    }
    
    // ===== NICE SELECT =====
    
    initNiceSelect() {
      if (!this.sortDropdown) {
        console.warn('  ⚠️  Sort dropdown element not found (#sort-select)');
        return;
      }
      
      if (typeof NiceSelect === 'undefined') {
        console.warn('  ⚠️  NiceSelect library not loaded yet');
        return;
      }
      
      try {
        // CRITICAL FIX: Always destroy existing NiceSelect instance first
        // (prevents issues when navigating back via popstate)
        const existingWrapper = this.sortDropdown.parentElement?.querySelector('.nice-select');
        if (existingWrapper) {
          console.log('  🧹 Cleaning up old NiceSelect wrapper');
          existingWrapper.remove();
        }
        
        // Reset the select element (NiceSelect hides it)
        this.sortDropdown.style.display = '';
        
        console.log('  🎨 Initializing NiceSelect on:', this.sortDropdown);
        
        this.niceSelect = NiceSelect.bind(this.sortDropdown, {
          searchable: false,
          placeholder: 'Select...',
          searchtext: 'Search',
          selectedtext: 'geselecteerd',
        });
        
        console.log('  ✅ NiceSelect initialized successfully!');
      } catch (error) {
        console.error('  ❌ Failed to initialize Nice Select 2:', error);
      }
    }
    
    updateNiceSelect(newValue) {
      if (this.sortDropdown) {
        try {
          this.sortDropdown.value = newValue;
          if (this.niceSelect) this.niceSelect.update();
        } catch (error) {
          console.error('Failed to update Nice Select:', error);
        }
      }
    }
    
    /**
     * Sync UI elements (checkboxes, dropdown) with current state
     * Called after loading from URL params or cache
     */
    syncUIWithState() {
      // 1. Update sort dropdown value and NiceSelect
      const currentSort = this.page.state.getCurrentSort();
      this.updateNiceSelect(currentSort);
      
      // 2. Update filter checkboxes
      const activeFilters = this.page.state.getActiveFilters();
      
      // First, uncheck all
      if (this.filterForm) {
        const allCheckboxes = this.filterForm.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(cb => cb.checked = false);
      }
      
      // Then check the active ones
      const aliasMap = {
        colors: ['color', 'colors', 'Color', 'Colors'],
        color: ['color', 'colors', 'Color', 'Colors'],
        size: ['size', 'sizes', 'Size', 'Sizes'],
        finish: ['finish', 'finishes', 'Finish', 'Finishes'],
        application: ['application', 'applications', 'Application', 'Applications'],
        material: ['material', 'materials', 'Material', 'Materials'],
        thickness: ['thickness', 'Thickness'],
      };
      
      Object.entries(activeFilters).forEach(([filterType, filterValues]) => {
        const candidateNames = aliasMap[filterType] || [filterType];
        filterValues.forEach((value) => {
          let checkbox = null;
          for (const name of candidateNames) {
            checkbox = this.filterForm?.querySelector(
              `input[name="${name}"][value="${value}"]`
            );
            if (checkbox) break;
          }
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      });
      
      // 3. Update filter chips
      this.updateFilterChips();
      
      console.log('  ✅ UI synced with state');
    }
    
    // ===== EVENT LISTENERS =====
    
    initEventListeners() {
      // Filter checkboxes
      if (this.filterForm) {
        this.filterForm.addEventListener(
          'change',
          async (e) => {
            if (e.target.type === 'checkbox') {
              this.updateFiltersFromCheckboxes();
              await this.applyFilters();
            }
          },
          { signal: this._ac.signal }
        );
      }
      
      // Sort dropdown
      if (this.sortDropdown) {
        this.sortDropdown.addEventListener(
          'change',
          async (e) => {
            this.page.state.setCurrentSort(e.target.value);
            await this.applyFilters();
          },
          { signal: this._ac.signal }
        );
      }
      
      // Clear button
      if (this.clearButton) {
        this.clearButton.addEventListener(
          'click',
          async (e) => {
            e.preventDefault();
            await this.clearAllFilters();
          },
          { signal: this._ac.signal }
        );
      }
      
      console.log('  ✅ Event listeners initialized');
    }
    
    // ===== FILTER MANAGEMENT =====
    
    updateFiltersFromCheckboxes() {
      const activeFilters = {};
      const checkedInputs = this.filterForm.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      checkedInputs.forEach((input) => {
        const filterTypeRaw = input.name;
        const filterValue = input.value;
        const filterType = this.normalizeFilterKey(filterTypeRaw);
        if (!activeFilters[filterType]) {
          activeFilters[filterType] = [];
        }
        activeFilters[filterType].push(filterValue);
      });
      this.page.state.setActiveFilters(activeFilters);
      this.updateFilterChips();
    }
    
    normalizeFilterKey(name) {
      const key = (name || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
      if (key === 'color' || key === 'colors') return 'colors';
      if (key === 'size' || key === 'sizes') return 'size';
      if (key === 'finish' || key === 'finishes') return 'finish';
      if (key === 'material' || key === 'materials') return 'material';
      if (key === 'application' || key === 'applications')
        return 'application';
      return key;
    }
    
    async applyFilters() {
      // Abort any pending requests
      if (this.page.api.abortController) {
        this.page.api.abortController.abort();
      }
      this.page.api.abortController = new AbortController();
      
      // Reset pagination
      this.page.state.setCurrentPage(1);
      this.page.state.setItems([]);
      
      // Clear container
      this.page.renderer.container.innerHTML = '';
      
      // CRITICAL FIX: Check cache BEFORE fetching!
      // Generate cache key based on NEW filter state (before URL is updated)
      const cacheData = this.page.cache.restore(false, this.page.state);
      
      if (cacheData) {
        // Cache hit! Restore state and render
        console.log('  💾 Restoring from cache instead of fetching');
        this.page.state.fromJSON(cacheData);
        await this.page.renderer.renderItems(this.page.state.getItems(), true);
        this.page.updateUI();
        
        // Initialize interactions for restored items
        this.setupProductClickTracking();
        this.initImageHover();
        this.updateProductImages();
        this.updateProductLinks();
        
        console.log(`  ✅ Restored ${this.page.state.getItems().length}/${this.page.state.getTotalItems()} items from cache`);
      } else {
        // Cache miss! Fetch fresh data
        console.log('  📡 No cache - fetching fresh data');
        await this.page.fetchItems(false);
      }
      
      // Update URL
      this.updateURLParams();
      
      // Update product links (for variants with query params)
      this.updateProductLinks();
    }
    
    async clearAllFilters() {
      const checkboxes = this.filterForm.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      checkboxes.forEach((checkbox) => (checkbox.checked = false));
      this.page.state.setCurrentSort('recommended');
      this.updateNiceSelect('recommended');
      this.updateFiltersFromCheckboxes();
      await this.applyFilters();
    }
    
    // ===== FILTER CHIPS =====
    
    updateFilterChips() {
      const chipContainer = document.querySelector('.filter-chip-group');
      if (!chipContainer) return;
      chipContainer.innerHTML = '';
      const activeFilters = this.page.state.getActiveFilters();
      Object.entries(activeFilters).forEach(
        ([filterType, filterValues]) => {
          filterValues.forEach((value) => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-chip-value', value);
            chip.setAttribute('data-chip-filter', filterType);
            const displayValue = value.charAt(0).toUpperCase() + value.slice(1);
            chip.innerHTML = `
            <div class="remove-btn"><div class="text-block-4">x</div></div>
            <div>${displayValue}</div>
          `;
            chipContainer.appendChild(chip);
          });
        }
      );
    }
    
    initFilterChipEvents() {
      document.addEventListener(
        'click',
        async (e) => {
          const removeBtn = e.target.closest('.remove-btn');
          if (!removeBtn) return;
          const chip = removeBtn.closest('.filter-chip');
          if (!chip) return;
          const filterType = chip.getAttribute('data-chip-filter');
          const filterValue = chip.getAttribute('data-chip-value');
          await this.removeFilter(filterType, filterValue);
        },
        { signal: this._ac.signal }
      );
    }
    
    async removeFilter(filterType, filterValue) {
      const aliasMap = {
        colors: ['color', 'colors', 'Color', 'Colors'],
        color: ['color', 'colors', 'Color', 'Colors'],
        size: ['size', 'sizes', 'Size', 'Sizes'],
        finish: ['finish', 'finishes', 'Finish', 'Finishes'],
        application: ['application', 'applications', 'Application', 'Applications'],
        material: [
          'material',
          'materials',
          'Material',
          'Materials',
          'material-type',
          'materialtype',
        ],
        thickness: ['thickness', 'Thickness'],
      };
      const candidateNames = aliasMap[filterType] || [filterType];
      let checkbox = null;
      for (const name of candidateNames) {
        checkbox = this.filterForm?.querySelector(
          `input[name="${name}"][value="${filterValue}"]`
        );
        if (checkbox) break;
      }
      if (checkbox) {
        checkbox.checked = false;
        this.updateFiltersFromCheckboxes();
        await this.applyFilters();
      }
    }
    
    // ===== URL PARAMS =====
    
    updateURLParams() {
      const params = new URLSearchParams();
      const activeFilters = this.page.state.getActiveFilters();
      Object.entries(activeFilters).forEach(
        ([filterType, filterValues]) => {
          if (filterValues.length > 0) {
            params.set(filterType, filterValues.join(','));
          }
        }
      );
      const currentSort = this.page.state.getCurrentSort();
      if (currentSort !== 'recommended') {
        params.set('sort', currentSort);
      }
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    // ===== PRODUCT LINKS & IMAGES =====
    
    updateProductLinks() {
      const currentProducts = document.querySelectorAll('.collection_grid-item');
      const activeFilters = this.page.state.getActiveFilters();
      const colorFilters = activeFilters.colors || activeFilters.color;
      
      currentProducts.forEach((product) => {
        const baseUrl = product.dataset.baseUrl || '';
        const productLinks = product.querySelectorAll(
          '.collection_image-cover, .collection_details'
        );
        
        // Determine main product URL
        let mainUrl = baseUrl;
        
        // If single color filter, link to that color variant
        if (colorFilters && colorFilters.length === 1) {
          const matching = this.getVariantsForColor(product, colorFilters[0].toLowerCase());
          if (matching.length === 1) {
            mainUrl = `${baseUrl}?variant=${matching[0]}`;
          }
        }
        
        // Update main product links (image cover + details)
        productLinks.forEach((link) => {
          link.href = mainUrl;
        });
        
        // IMPORTANT: Leave variant thumbnail links unchanged!
        // They already have ?variant=xxx in their href from createVariantThumbnailsHTML
        // We don't want to strip that out
      });
    }
    
    getVariantsForColor(gridItem, colorFilter) {
      const variantThumbs = gridItem.querySelectorAll('.variant-thumb');
      const matching = [];
      variantThumbs.forEach((thumb) => {
        const variantMeta = thumb.closest('.w-dyn-item')?.querySelector('.variant-meta');
        if (!variantMeta) return;
        const color = variantMeta.getAttribute('data-color');
        const slug = variantMeta.getAttribute('data-slug');
        if (!color || !slug) return;
        const variantColors = color.split(',').map((c) => c.trim().toLowerCase());
        if (variantColors.includes(colorFilter)) {
          matching.push(slug);
        }
      });
      return matching;
    }
    
    updateProductImages() {
      const colorFilters =
        this.page.state.getActiveFilters().colors || this.page.state.getActiveFilters().color;
      const currentProducts = document.querySelectorAll(
        '.collection_grid-item'
      );
      currentProducts.forEach((product, index) => {
        setTimeout(() => {
          if (colorFilters && colorFilters.length === 1) {
            const colorImage = this.getVariantImageForColor(
              product,
              colorFilters[0]
            );
            if (colorImage) {
              this.showImageOverlay(
                product,
                colorImage.src,
                colorImage.alt,
                true
              );
            }
          } else {
            this.restoreOriginalImage(product);
          }
        }, index * 1);
      });
    }
    
    getVariantImageForColor(product, colorFilter) {
      const variantThumbs = product.querySelectorAll('.variant-thumb');
      const normalizedColorFilter = colorFilter.toLowerCase();
      for (const thumb of variantThumbs) {
        const variantMeta = thumb.nextElementSibling;
        if (!variantMeta || !variantMeta.classList.contains('variant-meta'))
          continue;
        const colors = variantMeta.getAttribute('data-color');
        if (!colors) continue;
        const variantColors = colors
          .split(',')
          .map((c) => c.trim().toLowerCase());
        if (variantColors.includes(normalizedColorFilter)) {
          return { src: thumb.src, alt: thumb.alt };
        }
      }
      return null;
    }
    
    // ===== IMAGE HOVER =====
    
    initImageHover() {
      const currentProducts = document.querySelectorAll('.collection_grid-item');
      
      // Process in chunks to avoid blocking main thread
      const chunkSize = 5;
      let index = 0;
      
      const processChunk = () => {
        const chunk = Array.from(currentProducts).slice(index, index + chunkSize);
        
        chunk.forEach((product) => {
          if (product.dataset.hoverInitialized === 'true') return;
          
          const variantThumbs = product.querySelectorAll('.variant-thumb');
          const thumbnailContainer = product.querySelector(
            '.variant_thumbnail-list'
          );
          if (variantThumbs.length === 0) return;
          
          let hideTimeout;
          let isHoveringThumbnails = false;
          
          if (thumbnailContainer) {
            thumbnailContainer.addEventListener('mouseenter', () => {
              isHoveringThumbnails = true;
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
              }
            }, { passive: true });
            
            thumbnailContainer.addEventListener('mouseleave', () => {
              isHoveringThumbnails = false;
              hideTimeout = setTimeout(() => {
                this.hideImageOverlay(product);
              }, 200);
            }, { passive: true });
          }
          
          variantThumbs.forEach((thumb) => {
            thumb.addEventListener('mouseenter', () => {
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
              }
              const permanentOverlay = product.querySelector(
                '.overlay-img[data-permanent]'
              );
              if (!permanentOverlay) {
                this.showImageOverlay(product, thumb.src, thumb.alt, false);
              }
            }, { passive: true });
            
            thumb.addEventListener('mouseleave', () => {
              if (!isHoveringThumbnails) {
                hideTimeout = setTimeout(() => {
                  this.hideImageOverlay(product);
                }, 200);
              }
            }, { passive: true });
          });
          
          product.dataset.hoverInitialized = 'true';
        });
        
        index += chunkSize;
        
        // Process next chunk in next frame (avoid blocking)
        if (index < currentProducts.length) {
          requestAnimationFrame(processChunk);
        }
      };
      
      // Start processing first chunk
      if (currentProducts.length > 0) {
        requestAnimationFrame(processChunk);
      }
    }
    
    createImageOverlay(imageSrc, imageAlt) {
      return `
      <img 
        src="${imageSrc}" 
        alt="${imageAlt}" 
        loading="lazy"
        class="img-2 overlay-img"
        style="opacity: 0; transition: opacity 0.3s ease;"
      >
    `;
    }
    
    showImageOverlay(product, imageSrc, imageAlt, isPermanent = false) {
      const imageContainer = product.querySelector('.collection_image-cover');
      if (!imageContainer) return;
      
      const existingOverlay = imageContainer.querySelector('.overlay-img');
      if (existingOverlay) {
        existingOverlay.style.opacity = '0';
        setTimeout(() => existingOverlay.remove(), 10);
      }
      
      const overlayHTML = this.createImageOverlay(imageSrc, imageAlt);
      const mainImg = imageContainer.querySelector('.img-2:not(.overlay-img)');
      if (!mainImg) return;
      
      mainImg.insertAdjacentHTML('afterend', overlayHTML);
      const newOverlay = imageContainer.querySelector('.overlay-img');
      
      if (newOverlay) {
        requestAnimationFrame(() => {
          newOverlay.style.opacity = '1';
          product.dataset.hasOverlay = 'true';
          if (isPermanent) {
            newOverlay.dataset.permanent = 'true';
            setTimeout(() => {
              this.replaceMainImage(product, imageSrc, imageAlt);
            }, 300);
          }
        });
      }
    }
    
    hideImageOverlay(product) {
      const imageContainer = product.querySelector('.collection_image-cover');
      if (!imageContainer) return;
      const overlay = imageContainer.querySelector('.overlay-img');
      if (overlay && !overlay.dataset.permanent) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.remove();
            product.removeAttribute('data-has-overlay');
          }
        }, 300);
      }
    }
    
    replaceMainImage(product, imageSrc, imageAlt) {
      const mainImg = product.querySelector('.img-2:not(.overlay-img)');
      if (mainImg) {
        mainImg.src = imageSrc;
        mainImg.alt = imageAlt;
      }
    }
    
    restoreOriginalImage(product) {
      const mainImg = product.querySelector('.img-2:not(.overlay-img)');
      const permanentOverlay = product.querySelector('.overlay-img[data-permanent]');
      if (!mainImg) return;
      
      const originalSrc = mainImg.dataset.originalSrc;
      const originalAlt = mainImg.alt;
      
      if (originalSrc) {
        if (permanentOverlay) {
          permanentOverlay.style.opacity = '0';
          setTimeout(() => {
            if (permanentOverlay.parentNode) {
              permanentOverlay.remove();
              product.removeAttribute('data-has-overlay');
            }
          }, 300);
        }
        setTimeout(() => {
          this.replaceMainImage(product, originalSrc, originalAlt);
        }, permanentOverlay ? 300 : 0);
      }
    }
    
    // ===== PRODUCT CLICK TRACKING (for scroll restoration) =====
    
    setupProductClickTracking() {
      const productLinks = this.productContainer.querySelectorAll('.collection_image-cover, .collection_details, .variant-thumb-link');
      
      productLinks.forEach((link) => {
        // Remove old listener first (if any)
        link.removeEventListener('click', this._productClickHandler);
        
        // Add new listener
        link.addEventListener('click', this._productClickHandler);
      });
      
      console.log(`  🖱️  Product click tracking set up for ${productLinks.length} links`);
    }
    
    _productClickHandler = (e) => {
      const gridItem = e.currentTarget.closest('.collection_grid-item');
      if (gridItem) {
        const productId = gridItem.dataset.productId || gridItem.dataset.baseUrl;
        if (productId) {
          this.page.state.setClickedProductId(productId);
          this.page.cache.save(this.page.state);
          console.log(`  💾 Saved clicked product: ${productId}`);
        }
      }
    }
    
    // ===== CLEANUP =====
    
    destroy() {
      this._ac.abort();
      
      // Destroy NiceSelect instance
      if (this.niceSelect) {
        try {
          // Remove the NiceSelect wrapper
          const wrapper = this.sortDropdown?.parentElement?.querySelector('.nice-select');
          if (wrapper) {
            wrapper.remove();
          }
          
          // Reset the select element
          if (this.sortDropdown) {
            this.sortDropdown.style.display = '';
          }
          
          this.niceSelect = null;
          console.log('  🧹 NiceSelect destroyed');
        } catch (error) {
          console.error('Failed to destroy NiceSelect:', error);
        }
      }
      
      console.log('  👋 CollectionInteractions destroyed');
    }
  }

  // Filter drawer (GSAP animations)
  function setupFilterListeners() {
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
      // CRITICAL FIX: Remove any orphaned drawers from previous page visits
      const orphanedDrawers = pageWrapper.querySelectorAll('.filter-drawer');
      orphanedDrawers.forEach(old => {
        if (old !== drawer) {
          console.log('🧹 Removing orphaned drawer from .page-wrapper');
          old.remove();
        }
      });
      
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

  /**
   * Collections Page - Main Coordinator
   * Ties together all modules into a cohesive system
   */


  class CollectionsPage {
    constructor() {
      // Initialize modules
      this.state = new CollectionState();
      this.cache = new CollectionCache();
      this.api = new CollectionAPI();
      this.renderer = new CollectionRenderer('.product-grid');
      this.infiniteScroll = null;
      this.interactions = null; // Initialize after DOM is ready
      
      // Loading flag
      this.isLoading = false;
      
      console.log('🎬 CollectionsPage initialized');
    }
    
    /**
     * Play page enter animation (reveals page immediately)
     */
    playPageEnterAnimation() {
      // 0. Reveal page immediately (hidden by CSS/transition to prevent FOUC)
      const view = document.querySelector('[data-taxi-view="collections"]');
      if (view) {
        // CRITICAL: Use vanilla JS for immediate effect (GSAP batches changes)
        view.style.opacity = '1';
        
        // Force GSAP to apply immediately
        if (window.gsap) {
          window.gsap.set(view, { opacity: 1, force3D: false });
        }
        
        console.log('  👁️  Page revealed (opacity forced to 1)');
      }
      
      if (!window.gsap) return Promise.resolve();
      
      const tl = window.gsap.timeline();
      
      // 1. Heading chars: y: 100% → 0%
      const heading = document.querySelector('.font-color-primary');
      if (heading && window.SplitText) {
        const split = new window.SplitText(heading, { 
          type: 'chars',
          charsClass: 'char',
        });
        
        window.gsap.set(split.chars, { yPercent: 100 });
        
        tl.to(split.chars, {
          yPercent: 0,
          duration: 0.65,
          ease: 'expo.out',
          stagger: 0.007,
        }, 0);
      }
      
      // 2. Filter button: y: 100% → 0%
      const filterButton = document.querySelector('#filters-open');
      if (filterButton) {
        window.gsap.set(filterButton, { clearProps: 'transform' });
        window.gsap.set(filterButton, { yPercent: 100 });
        
        tl.to(filterButton, {
          yPercent: 0,
          duration: 0.65,
          ease: 'expo.out',
        }, 0.035);
      }
      
      return tl;
    }
    
    /**
     * Play page exit animation
     */
    playPageExitAnimation() {
      if (!window.gsap) return Promise.resolve();
      
      const tl = window.gsap.timeline();
      
      // 1. Heading chars: 0% → y: 100% (exit down)
      const heading = document.querySelector('.font-color-primary');
      if (heading && window.SplitText) {
        const split = new window.SplitText(heading, { 
          type: 'chars',
          charsClass: 'char',
        });
        
        tl.to(split.chars, {
          yPercent: 100,
          duration: 0.35,
          ease: 'power2.in',
          stagger: 0.005,
        }, 0);
      }
      
      // 2. Filter button: 0% → y: 100% (exit down)
      const filterButton = document.querySelector('#filters-open');
      if (filterButton) {
        tl.to(filterButton, {
          yPercent: 100,
          duration: 0.35,
          ease: 'power2.in',
        }, 0.035);
      }

      // 3. Collection Items: fade + slide down
      const items = document.querySelectorAll('.collection_grid-item');
      if (items.length > 0) {
        tl.to(items, {
          opacity: 0,
          y: 15,
          duration: 0.32,
          ease: 'power2.in',
          stagger: 0.013,
        }, 0.07);
      }
      
      return tl;
    }
    
    /**
     * Setup filter UI interactions (drawer + accordion)
     */
    setupFilterUI() {
      // Filter drawer open/close
      setupFilterListeners();
      
      // Filter accordion expand/collapse
      this.setupFilterAccordions();
      
      // Initialize interactions module (filters, sorting, image hover)
      this.interactions = new CollectionInteractions(this);
      this.interactions.init();
    }
    
    /**
     * Setup filter accordion interactions
     */
    setupFilterAccordions() {
      if (!window.gsap) return;
      
      const filterHeaders = document.querySelectorAll('.filter-header');
      
      filterHeaders.forEach((header) => {
        // Skip if already initialized
        if (header.dataset.accordionInit === 'true') return;
        
        const filterGroup = header.closest('.filter-group');
        const icon = header.querySelector('.icon-sm');
        
        if (!filterGroup || !icon) return;
        
        // Create timeline for this specific accordion (paused initially)
        const tl = window.gsap.timeline({ 
          paused: true,
          onComplete: () => { header._isOpen = true; },
          onReverseComplete: () => { header._isOpen = false; }
        });
        
        // Action 1: Animate filter group height
        tl.fromTo(filterGroup, 
          { height: '2em' },
          { 
            height: 'auto',
            duration: 0.25,
            ease: 'power3.inOut'
          },
          0 // Start at time 0
        );
        
        // Action 2: Animate icon rotation (in parallel)
        tl.fromTo(icon,
          { rotation: -90 },
          { 
            rotation: 0,
            duration: 0.25,
            ease: 'power3.inOut'
          },
          0 // Start at time 0 (parallel with action 1)
        );
        
        // Store timeline on the header element
        header._timeline = tl;
        header._isOpen = false;
        
        // Click handler with toggle and mid-animation reversal support
        header.addEventListener('click', () => {
          // Check if animation is currently running
          if (tl.isActive()) {
            // Reverse from current position
            tl.reversed(!tl.reversed());
          } else {
            // Not playing, toggle based on current state
            if (header._isOpen) {
              // Close: reverse the animation
              tl.reverse();
              header._isOpen = false;
            } else {
              // Open: play the animation forward
              tl.play();
              header._isOpen = true;
            }
          }
        });
        
        // Mark as initialized
        header.dataset.accordionInit = 'true';
      });
    }
    
    /**
     * Initialize the page
     */
    async init(isBackButton = false) {
      console.log('%c========== COLLECTIONS INIT ==========', 'color: #00ff00; font-weight: bold');
      console.log(`URL: ${window.location.href}`);
      console.log(`Back button: ${isBackButton}`);
      
      // Register state IMMEDIATELY for exit animation
      setState('collections', {
        playExitAnimation: () => this.playPageExitAnimation(),
      });
      
      // Step 0: Play page enter animation (reveals page + animates elements)
      this.playPageEnterAnimation();
      
      // Step 0.5: Setup filter drawer and accordion interactions
      this.setupFilterUI();
      
      // Step 1: Load URL params into state
      this.loadURLParams();
      
      // Step 1.5: Sync UI with state (checkboxes, dropdown, chips)
      if (this.interactions) {
        this.interactions.syncUIWithState();
      }
      
      // Step 2: Try to restore from cache
      const cacheData = this.cache.restore(isBackButton);
      
      if (cacheData) {
        // Cache hit! Restore state and render
        this.state.fromJSON(cacheData);
        await this.renderer.renderItems(this.state.getItems(), true);
        this.updateUI();
        
        // Initialize interactions for restored items
        if (this.interactions) {
          this.interactions.setupProductClickTracking();
          this.interactions.initImageHover();
          this.interactions.updateProductImages();
          this.interactions.updateProductLinks();
        }
        
        // Schedule scroll restoration if back button
        if (isBackButton && this.state.clickedProductId) {
          window.__pendingScrollRestoration = this.state.clickedProductId;
        }
        
        console.log(`✅ Restored from cache: ${this.state.getItems().length}/${this.state.getTotalItems()} items`);
      } else {
        // Cache miss! Fetch fresh data
        console.log('  📡 No cache - fetching fresh data');
        await this.loadInitialData();
      }
      
      // Step 3: Initialize infinite scroll
      this.initInfiniteScroll();
      
      // BUG FIX: Save to cache AFTER everything is loaded
      this.cache.save(this.state);
      
      console.log('%c========== INIT COMPLETE ==========', 'color: #00ff00; font-weight: bold');
    }
    
    /**
     * Load URL parameters into state
     */
    loadURLParams() {
      const params = new URLSearchParams(window.location.search);
      
      // Load sort
      const sort = params.get('sort');
      if (sort) {
        this.state.setCurrentSort(sort);
      }
      
      // Load filters
      const filters = {};
      for (const [key, value] of params.entries()) {
        if (['sort', 'page', 'limit', 'config', 'collection_id'].includes(key)) {
          continue;
        }
        if (value) {
          filters[key] = value.split(',');
        }
      }
      
      this.state.setActiveFilters(filters);
      
      console.log('  📄 Loaded from URL:', {
        sort: this.state.getCurrentSort(),
        filters: this.state.getActiveFilters()
      });
    }
    
    /**
     * Load initial data (page 1)
     */
    async loadInitialData() {
      this.state.reset();
      await this.fetchItems();
    }
    
    /**
     * Fetch items from API
     */
    async fetchItems(append = false) {
      if (this.isLoading) return;
      this.isLoading = true;
      
      try {
        // Show skeletons
        if (!append) {
          this.renderer.showSkeletonLoaders(this.state.itemsPerPage);
        } else {
          const remaining = this.state.getTotalItems() - this.state.getItems().length;
          const count = Math.min(remaining, this.state.itemsPerPage);
          this.renderer.showSkeletonLoaders(count);
        }
        
        // Small delay for UX (prevent jarring if API is fast)
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Fetch from API
        const data = await this.api.fetchItems(this.state);
        
        // Update state
        if (append) {
          this.state.appendItems(data.items);
        } else {
          this.state.setItems(data.items);
        }
        
        this.state.setTotalItems(data.pagination.total);
        // API uses camelCase: hasMore, not has_more
        this.state.setHasMorePages(data.pagination.hasMore || false);
        
        console.log(`  📊 Pagination updated:`, {
          currentPage: this.state.getCurrentPage(),
          itemsLoaded: this.state.getItems().length,
          totalItems: this.state.getTotalItems(),
          hasMore: data.pagination.hasMore,
          hasMoreInState: this.state.hasMorePages,
        });
        
        // Render
        if (append) {
          await this.renderer.appendItems(data.items);
        } else {
          await this.renderer.renderItems(data.items);
        }
        
        // Update UI
        this.updateUI();
        
        // Initialize interactions for new items (image hover, product links, click tracking)
        if (this.interactions) {
          this.interactions.setupProductClickTracking();
          this.interactions.initImageHover();
          this.interactions.updateProductImages();
          this.interactions.updateProductLinks();
        }
        
        // Increment page for next fetch
        this.state.incrementPage();
        console.log(`  📄 Next page will be: ${this.state.getCurrentPage()}`);
        
        // BUG FIX: Save to cache AFTER state is updated
        this.cache.save(this.state);
        
        console.log(`✅ Fetch complete: ${this.state.getItems().length}/${this.state.getTotalItems()} items loaded`);
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
          this.handleError(error);
        }
      } finally {
        this.isLoading = false;
      }
    }
    
    /**
     * Initialize infinite scroll
     */
    initInfiniteScroll() {
      if (this.infiniteScroll) {
        this.infiniteScroll.destroy();
      }
      
      this.infiniteScroll = new CollectionInfiniteScroll(
        '.product-grid',
        () => {
          console.log('  ♾️  Infinite scroll triggered:', {
            hasMorePages: this.state.hasMorePages,
            isLoading: this.isLoading,
            itemsLoaded: this.state.getItems().length,
            totalItems: this.state.getTotalItems(),
          });
          
          if (this.state.hasMorePages && !this.isLoading) {
            this.fetchItems(true);
          } else if (!this.state.hasMorePages) {
            console.log('  ⛔ No more pages to load');
          } else if (this.isLoading) {
            console.log('  ⏳ Already loading, skipping');
          }
        }
      );
      
      this.infiniteScroll.init();
    }
    
    /**
     * Update UI elements (results counter, etc.)
     */
    updateUI() {
      // Update results counter
      const counter = document.querySelector('[data-results-count]');
      if (counter) {
        counter.textContent = this.state.getTotalItems();
      }
      
      // Update clear button state
      const clearButton = document.querySelector('.button.alt');
      if (clearButton) {
        const hasFilters = this.state.hasFilters();
        clearButton.style.opacity = hasFilters ? '1' : '0.5';
        clearButton.disabled = !hasFilters;
      }
    }
    
    /**
     * Handle errors
     */
    handleError(error) {
      console.error('CollectionsPage error:', error);
      this.renderer.clear();
      this.renderer.container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c33;">
        <h3>Error loading products</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #c33; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
    }
    
    /**
     * Cleanup on page leave
     */
    destroy() {
      if (this.infiniteScroll) {
        this.infiniteScroll.destroy();
      }
      
      if (this.interactions) {
        this.interactions.destroy();
      }
      
      // CRITICAL FIX: Remove filter drawer from .page-wrapper when leaving page
      // (prevents drawer staying visible/open when navigating away)
      const pageWrapper = document.querySelector('.page-wrapper');
      if (pageWrapper) {
        const drawers = pageWrapper.querySelectorAll('.filter-drawer');
        drawers.forEach(drawer => {
          console.log('  🧹 Removing filter drawer from .page-wrapper on page leave');
          drawer.remove();
        });
      }
      
      // Clear pending scroll restoration
      window.__pendingScrollRestoration = null;
      
      // Save one last time before leaving
      this.cache.save(this.state);
      
      // Clear state from global store
      setState('collections', null);
      
      console.log('  👋 CollectionsPage destroyed');
    }
  }

  // Export init function for compatibility with existing code
  async function initCollections(isBackButton = false) {
    // CRITICAL: Reveal page IMMEDIATELY before creating any modules
    // This must happen synchronously before any async operations
    const view = document.querySelector('[data-taxi-view="collections"]');
    if (view) {
      view.style.opacity = '1';
      if (window.gsap) {
        window.gsap.set(view, { opacity: 1, force3D: false });
      }
      console.log('  👁️  Page revealed IMMEDIATELY (before CollectionsPage)');
    }
    
    const page = new CollectionsPage();
    
    // Initialize (async)
    await page.init(isBackButton);
    
    return page;
  }

  // Collections page renderer

  function createCollectionsRenderer() {
    const DefaultRenderer = createDefaultRenderer();
    
    return class CollectionsRenderer extends DefaultRenderer {
      constructor(props) {
        super(props);
        this.pageInstance = null; // Store page instance for cleanup
      }
      
      initialLoad() {
        // Don't call initCollections() here - let onEnter() handle it
        this.onEnter();
        this.onEnterCompleted();
      }
      
      async onEnter() {
        // Get trigger from global variable set by NAVIGATE_IN hook
        const trigger = window.__taxiNavigationTrigger;
        const isBackButton = trigger === 'popstate';
        console.log('🎬 CollectionsRenderer onEnter - trigger:', trigger, 'isBackButton:', isBackButton);
        
        // Pass back button flag to initCollections and store the instance
        // (Page reveal happens in CollectionsPage.init())
        this.pageInstance = await initCollections(isBackButton);
      }
      
      onLeave() {
        // Close filter drawer immediately if it's open (before transition starts)
        const drawer = document.querySelector('.filter-drawer');
        if (drawer && window.gsap) {
          const currentOpacity = window.getComputedStyle(drawer).opacity;
          if (parseFloat(currentOpacity) > 0) {
            console.log('🎬 CollectionsRenderer onLeave - closing drawer');
            window.gsap.to(drawer, {
              opacity: 0,
              duration: 0.15,
              ease: 'power2.out',
              onComplete: () => {
                window.gsap.set(drawer, { display: 'none' });
              }
            });
          }
        }
      }
      
      onLeaveCompleted() {
        // CRITICAL FIX: Call destroy AFTER transition completes
        // (onLeave is too early - transition needs state for exit animation)
        if (this.pageInstance && typeof this.pageInstance.destroy === 'function') {
          console.log('🎬 CollectionsRenderer onLeaveCompleted - destroying page instance');
          this.pageInstance.destroy();
          this.pageInstance = null;
        }
      }
    };
  }

  // Product page: Fancyapps Carousel + Fancybox

  // Page enter animation
  function playPageEnterAnimation() {
    // 0. Reveal page immediately (hidden by CSS/transition to prevent FOUC)
    const view = document.querySelector('[data-taxi-view="product"]');
    if (view) {
      if (window.gsap) {
        gsap.set(view, { opacity: 1 });
      } else {
        // Fallback if GSAP not loaded yet
        view.style.opacity = '1';
      }
    }
    
    if (!window.gsap) return Promise.resolve();
    
    const tl = gsap.timeline();
    
    // 1. Hero cover: width 100% → 0%
    const heroCover = document.querySelector('.hero-cover');
    if (heroCover) {
      gsap.set(heroCover, { width: '100%' });
      tl.to(heroCover, {
        width: '0%',
        duration: 0.85,
        ease: 'expo.inOut',
      }, 0);
    }
    
    // 2. Product title: words + chars split, opacity + y offset
    const title = document.querySelector('#product-title');
    if (title && window.SplitText) {
      const split = new SplitText(title, { type: 'words,chars' });
      gsap.set(split.chars, { opacity: 0, yPercent: 20 });
      
      tl.to(split.chars, {
        opacity: 1,
        yPercent: 0,
        duration: 0.85,
        ease: 'expo.out',
        stagger: 0.17 / split.chars.length, // Total stagger time: 0.17s
      }, 0.17);
    }
    
    // 3. Product description: lines split with mask
    const description = document.querySelector('.product-description');
    if (description && window.SplitText) {
      const split = new SplitText(description, { 
        type: 'lines',
        linesClass: 'split-line',
      });
      
      // Wrap each line in a mask div
      split.lines.forEach(line => {
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        line.parentNode.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });
      
      gsap.set(split.lines, { yPercent: 100 });
      
      tl.to(split.lines, {
        yPercent: 0,
        duration: 0.85,
        ease: 'expo.out',
        stagger: 0.085 / split.lines.length, // Total stagger time: 0.085s
      }, 0.3);
    }
    
    // 4-9. Variant sections and specs
    const elements = [
      { selector: '.variant-buttons', start: 0.45 },
      { selector: '.variant-sizes', start: 0.51 },
      { selector: '.variant-finishes', start: 0.59 },
      { selector: '#material', start: 0.66 },
      { selector: '#thickness', start: 0.73 },
      { selector: '#applications', start: 0.8 },
    ];
    
    elements.forEach(({ selector, start }) => {
      const el = document.querySelector(selector);
      if (el) {
        gsap.set(el, { opacity: 0, yPercent: 20 });
        tl.to(el, {
          opacity: 1,
          yPercent: 0,
          duration: 0.7,
          ease: 'expo.out',
        }, start);
      }
    });
    
    return tl;
  }

  // Page exit animation (reverse of enter, faster, tighter)
  function playPageExitAnimation() {
    if (!window.gsap) return Promise.resolve();
    
    const tl = gsap.timeline();
    
    // 1-6. Variant sections and specs (reverse order, exit down)
    const elements = [
      { selector: '#applications', start: 0 },
      { selector: '#thickness', start: 0.025 },
      { selector: '#material', start: 0.05 },
      { selector: '.variant-finishes', start: 0.075 },
      { selector: '.variant-sizes', start: 0.1 },
      { selector: '.variant-buttons', start: 0.125 },
    ];
    
    elements.forEach(({ selector, start }) => {
      const el = document.querySelector(selector);
      if (el) {
        tl.to(el, {
          opacity: 0,
          yPercent: 20, // Exit down (same direction as enter from)
          duration: 0.35,
          ease: 'power2.in',
        }, start);
      }
    });
    
    // 7. Description exit (lines go back DOWN with masking)
    const description = document.querySelector('.product-description');
    if (description && window.SplitText) {
      const split = new SplitText(description, { type: 'lines' });
      
      // Re-wrap lines in mask if needed
      split.lines.forEach(line => {
        if (!line.parentNode.style.overflow) {
          const wrapper = document.createElement('div');
          wrapper.style.overflow = 'hidden';
          line.parentNode.insertBefore(wrapper, line);
          wrapper.appendChild(line);
        }
      });
      
      tl.to(split.lines, {
        yPercent: 100, // Exit DOWN (back where it came from)
        duration: 0.35,
        ease: 'power2.in',
        stagger: 0.025 / split.lines.length,
      }, 0.15);
    }
    
    // 8. Product title chars exit down
    const title = document.querySelector('#product-title');
    if (title && window.SplitText) {
      const split = new SplitText(title, { type: 'chars' });
      
      tl.to(split.chars, {
        opacity: 0,
        yPercent: 20, // Exit down (same direction as enter from)
        duration: 0.35,
        ease: 'power2.in',
        stagger: 0.05 / split.chars.length,
      }, 0.175);
    }
    
    // 9. Hero cover: width 0% → 100% (last, covers everything)
    const heroCover = document.querySelector('.hero-cover');
    if (heroCover) {
      tl.to(heroCover, {
        width: '100%',
        duration: 0.45,
        ease: 'expo.inOut',
      }, 0.2);
    }
    
    return tl;
  }

  async function initProduct(nsCtx) {
    // Load GSAP SplitText for animations
    if (!window.SplitText) {
      await loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/SplitText.min.js'
      );
    }
    
    // Load styles and scripts
    await loadStyle(
      'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/carousel/carousel.css'
    );
    await loadStyle(
      'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/fancybox/fancybox.css'
    );

    if (!window.Carousel) {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/carousel/carousel.umd.js'
      );
    }
    if (!window.Fancybox) {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/fancybox/fancybox.umd.js'
      );
    }
    if (!window.Arrows) {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/carousel/carousel.arrows.umd.js'
      );
    }
    if (!window.Dots) {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/carousel/carousel.dots.umd.js'
      );
    }
    if (!window.Thumbs) {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/@fancyapps/ui@6.0/dist/carousel/carousel.thumbs.umd.js'
      );
    }

    // If no product carousel, skip
    const container = document.getElementById('product-carousel');
    const mainImg = document.querySelector('.product-image');
    const productName = document.querySelector('[data-product-name]');
    if (!container || !mainImg || !productName) {
      setState('product', { 
        playExitAnimation: () => playPageExitAnimation(),
        destroy: () => {} 
      });
      return;
    }
    
    // Set up state IMMEDIATELY with exit animation
    setState('product', {
      playExitAnimation: () => playPageExitAnimation(),
      destroy: () => {}, // Will be updated with actual destroy
    });
    
    // Play page enter animation
    playPageEnterAnimation();

    class ProductSlider {
      constructor() {
        this.slides = [];
        this.variants = [];
        this.selectedVariant = null;
        this.carousel = null;
        this.fancybox = null;
        this.initialSlideIndex = 0;
        this.isInitialLoad = true;
        this._ac = new AbortController();

        this.init();
      }

      init() {
        this.extractProductData();
        this.determineInitialSlide();
        this.buildCarousel();
        this.buildVariantButtons();
        this.setupFancybox();

        const variantInfo = document.querySelector('.variant-info');
        if (variantInfo) variantInfo.style.display = 'none';

        this.handleInitialVariant();
      }

      extractProductData() {
        const mainImage = document.querySelector('.product-image');
        const productName =
          document.querySelector('[data-product-name]').textContent;

        this.slides = [
          {
            type: 'main',
            src: mainImage.src,
            alt: `${productName} - Main Image`,
            variantSlug: null,
            w: 1200,
            h: 800,
          },
        ];

        this.variants = [];
        const variantItems = document.querySelectorAll(
          '.variants-list .w-dyn-item'
        );
        variantItems.forEach((item) => {
          const nameEl = item.children[0];
          const imgEl = item.querySelector('img');
          const metaEl = item.querySelector('.product-variant-meta');
          const variant = {
            name: nameEl.textContent,
            slug: metaEl.dataset.variantSlug,
            image: imgEl.src,
            sizes: metaEl.dataset.sizes.split(',').map((s) => s.trim()),
            finishes: metaEl.dataset.finishes.split(',').map((f) => f.trim()),
          };
          this.variants.push(variant);
          this.slides.push({
            type: 'variant',
            src: variant.image,
            alt: `${productName} - ${variant.name}`,
            variantSlug: variant.slug,
            w: 1200,
            h: 800,
          });
        });
      }

      determineInitialSlide() {
        const urlParams = new URLSearchParams(window.location.search);
        const variantFromUrl = urlParams.get('variant');
        this.initialSlideIndex = 0;
        if (
          variantFromUrl &&
          this.variants.some((v) => v.slug === variantFromUrl)
        ) {
          const variantSlideIndex = this.slides.findIndex(
            (slide) => slide.variantSlug === variantFromUrl
          );
          if (variantSlideIndex !== -1) {
            this.initialSlideIndex = variantSlideIndex;
            this.selectedVariant = variantFromUrl;
            return;
          }
        }
        if (this.variants.length > 0) {
          this.selectedVariant = this.variants[0].slug;
        } else {
          this.selectedVariant = null;
        }
      }

      buildCarousel() {
        const carouselContainer = document.getElementById('product-carousel');
        if (!carouselContainer) return;

        carouselContainer.innerHTML = '';
        this.slides.forEach((slide) => {
          const slideEl = document.createElement('div');
          slideEl.className = 'f-carousel__slide';
          const img = document.createElement('img');
          img.src = slide.src;
          img.alt = slide.alt;
          img.dataset.fancybox = 'gallery';
          img.dataset.src = slide.src;
          img.dataset.caption = slide.alt;
          img.className = 'carousel-image';
          img.style.cursor = 'pointer';
          slideEl.appendChild(img);
          carouselContainer.appendChild(slideEl);
        });

        try {
          // Factory style
          this.carousel = Carousel(
            carouselContainer,
            {
              infinite: true,
              center: true,
              fill: true,
              dragFree: false,
              initialPage: this.initialSlideIndex,
            },
            { Arrows, Thumbs }
          ).init();
        } catch (error) {
          console.error('Failed to initialize Carousel:', error);
        }
      }

      setupFancybox() {
        Fancybox.bind('[data-fancybox="gallery"]', {
          Carousel: {
            Toolbar: {
              display: { right: ['zoomIn', 'zoomOut', 'thumbs', 'close'] },
            },
          },
        });
      }

      buildVariantButtons() {
        const container = document.querySelector('.variant-buttons');
        if (!container) return;
        container.innerHTML = '';
        this.variants.forEach((variant) => {
          const button = document.createElement('button');
          button.className = 'variant-btn';
          button.dataset.variantSlug = variant.slug;
          button.innerHTML = `
          <img src="${variant.image}" alt="${variant.name}" class="variant-btn-image">
          <span>${this.slugToName(variant.name)}</span>
        `;
          button.addEventListener(
            'click',
            () => {
              this.isInitialLoad = false;
              this.selectVariant(variant.slug, true);
            },
            { signal: this._ac.signal }
          );
          container.appendChild(button);
        });
      }

      handleInitialVariant() {
        if (this.selectedVariant) {
          const urlParams = new URLSearchParams(window.location.search);
          const variantFromUrl = urlParams.get('variant');
          const isFromUrlParam = variantFromUrl === this.selectedVariant;
          if (isFromUrlParam) {
            this.selectVariant(this.selectedVariant, true, false);
          } else {
            this.selectVariant(this.selectedVariant, false, false);
          }
        }
        setTimeout(() => {
          this.isInitialLoad = false;
        }, 100);
      }

      selectVariant(variantSlug, slideToVariant = true, updateURL = true) {
        this.selectedVariant = variantSlug;
        document.querySelectorAll('.variant-btn').forEach((btn) => {
          btn.classList.toggle(
            'selected',
            btn.dataset.variantSlug === variantSlug
          );
        });
        if (slideToVariant && this.carousel) {
          const variantSlideIndex = this.slides.findIndex(
            (slide) => slide.variantSlug === variantSlug
          );
          if (variantSlideIndex !== -1) {
            try {
              if (typeof this.carousel.slideTo === 'function') {
                this.carousel.slideTo(variantSlideIndex);
              } else if (typeof this.carousel.goTo === 'function') {
                this.carousel.goTo(variantSlideIndex);
              } else {
                this.carousel.page = variantSlideIndex;
              }
            } catch (error) {
              console.error('Error navigating to slide:', error);
            }
          }
        }
        this.displayVariantInfo(variantSlug);
        if (updateURL) this.updateURLParams();
      }

      displayVariantInfo(variantSlug) {
        const infoEl = document.querySelector('.variant-info');
        if (!variantSlug) {
          if (infoEl) infoEl.style.display = 'none';
          return;
        }
        const variant = this.variants.find((v) => v.slug === variantSlug);
        if (!variant) {
          if (infoEl) infoEl.style.display = 'none';
          return;
        }
        const nameEl = document.querySelector('.variant-name');
        const sizesEl = document.querySelector('.sizes-list');
        const finishesEl = document.querySelector('.finishes-list');
        if (!infoEl || !nameEl || !sizesEl || !finishesEl) return;

        nameEl.textContent = this.slugToName(variant.name);
        sizesEl.innerHTML = '';
        finishesEl.innerHTML = '';
        variant.sizes.forEach((size) => {
          const sizeItem = document.createElement('div');
          sizeItem.className = 'size-item';
          sizeItem.textContent = this.slugToName(size);
          sizesEl.appendChild(sizeItem);
        });
        variant.finishes.forEach((finish) => {
          const finishItem = document.createElement('div');
          finishItem.className = 'finish-item';
          finishItem.textContent = this.slugToName(finish);
          finishesEl.appendChild(finishItem);
        });
        infoEl.style.display = 'block';
      }

      slugToName(slug) {
        return slug
          .split(/[-_\s]+/)
          .map(
            (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          )
          .join(' ');
      }

      updateURLParams() {
        const url = new URL(window.location);
        if (this.selectedVariant) {
          url.searchParams.set('variant', this.selectedVariant);
        } else {
          url.searchParams.delete('variant');
        }
        window.history.replaceState(null, '', url);
      }

      destroy() {
        try {
          this._ac?.abort?.();
        } catch (e) {}
        try {
          this.carousel?.destroy?.();
        } catch (e) {}
        try {
          // Unbind Fancybox for this gallery
          if (window.Fancybox && Fancybox.destroy) {
            Fancybox.destroy();
          }
        } catch (e) {}
      }
    }

    const ps = new ProductSlider();
    
    // Update state with actual destroy function
    const existingState = { playExitAnimation: () => playPageExitAnimation() };
    setState('product', {
      ...existingState,
      destroy: () => ps.destroy(),
    });
  }

  // Product page renderer

  function createProductRenderer() {
    const DefaultRenderer = createDefaultRenderer();
    
    return class ProductRenderer extends DefaultRenderer {
      initialLoad() {
        initProduct();
        this.onEnter();
        this.onEnterCompleted();
      }
      
      async onEnter() {
        await initProduct();
      }
    };
  }

  // Smart transition that detects home page and plays custom animations

  function createSmartTransition() {
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
        
        // Check which page we're entering
        const toViewName = to.getAttribute('data-taxi-view');
        
        // Collections page handles its own opacity reveal
        // Don't interfere with it here
        if (toViewName !== 'collections') {
          // Keep page hidden - let page animations control the reveal
          gsap.set(to, { opacity: 0 });
        }
        
        // Transition complete - renderer will handle page animations
        done();
      }
    };
  }

  // Taxi.js initialization

  function initTaxi() {
    // Check if taxi is available (loaded via CDN)
    if (typeof window.taxi === 'undefined') {
      console.error('Taxi.js not found! Make sure CDN scripts are loaded.');
      return null;
    }
    
    // Create renderer and transition classes
    const DefaultRenderer = createDefaultRenderer();
    const HomeRenderer = createHomeRenderer();
    const CollectionsRenderer = createCollectionsRenderer();
    const ProductRenderer = createProductRenderer();
    const SmartTransition = createSmartTransition();
    
    // Initialize Taxi
    const taxiInstance = new window.taxi.Core({
      links: 'a:not([target]):not([href^="#"]):not([data-taxi-ignore])',
      removeOldContent: true,
      allowInterruption: false,
      enablePrefetch: true,
      
      transitions: {
        default: SmartTransition,
      },
      
      renderers: {
        default: DefaultRenderer,
        home: HomeRenderer,
        collections: CollectionsRenderer,
        product: ProductRenderer,
      },
    });
    
    // Initialize navigation
    initScalingHamburgerNavigation();
    updateActiveNavLinks();
    
    // Disable native scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Store navigation trigger globally so renderers can access it
    window.__taxiNavigationTrigger = null;
    
    // Global hooks
    taxiInstance.on('NAVIGATE_IN', ({ trigger }) => {
      window.__taxiNavigationTrigger = trigger;
    });
    
    taxiInstance.on('NAVIGATE_OUT', ({ from }) => {
      closeNav(true);
      
      // Stop Lenis momentum scroll before navigation
      if (window.lenis) {
        window.lenis.stop();
      }
    });

    taxiInstance.on('NAVIGATE_END', ({ to }) => {
      updateActiveNavLinks(window.location.pathname);
      reinitWebflow();
      
      // Restart Lenis after navigation
      if (window.lenis) {
        window.lenis.start();
      }
      
      // Handle pending scroll restoration
      if (window.__pendingScrollRestoration) {
        const productId = window.__pendingScrollRestoration;
        window.__pendingScrollRestoration = null;
        
        setTimeout(() => {
          if (window.lenis) {
            window.lenis.resize();
            
            const productEl = document.querySelector(`[data-product-id="${productId}"]`);
            if (productEl) {
              window.lenis.scrollTo(productEl, {
                duration: 0.6,
                offset: -100,
                easing: (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
              });
            }
          }
        }, 200);
      }
    });
    
    taxiInstance.on('NAVIGATE_ERROR', (error) => {
      console.error('Navigation error:', error);
    });
    
    return taxiInstance;
  }

  // Main entry point - Taxi.js SPA

  const VERSION = '4.4.5';

  console.log(`Versatile Site v${VERSION}`);

  document.addEventListener('DOMContentLoaded', () => {
    const taxi = initTaxi();
    
    if (!taxi) {
      console.error('Taxi.js failed to initialize');
    }
  });

})();
//# sourceMappingURL=main.js.map
