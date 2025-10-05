// main.js
// Utilities: asset loader with dedupe
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

// Webflow interactions re-init
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

// ------------------------------------
// Global: button character stagger
// ------------------------------------
function initButtonCharacterStagger() {
  const offsetIncrement = 0.015;
  const buttons = document.querySelectorAll('[data-button-animate-chars]');
  buttons.forEach((button) => {
    const text = button.textContent;
    button.innerHTML = '';
    [...text].forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.transitionDelay = `${index * offsetIncrement}s`;
      if (char === ' ') span.style.whiteSpace = 'pre';
      button.appendChild(span);
    });
  });
}

// ------------------------------------
// Global: persistent nav (outside Barba)
// ------------------------------------
const NAV_STATUS_SEL = '[data-navigation-status]';
const NAV_TOGGLE_SEL = '[data-navigation-toggle="toggle"]';
const NAV_CLOSE_SEL = '[data-navigation-toggle="close"]';
const NAV_LINK_SEL =
  '[data-navigation] a[href]:not([target="_blank"]):not([data-no-barba])';

function navEl() {
  return document.querySelector(NAV_STATUS_SEL);
}
function openNav() {
  const el = navEl();
  if (el) el.setAttribute('data-navigation-status', 'active');
}
function closeNav() {
  const el = navEl();
  if (el) el.setAttribute('data-navigation-status', 'not-active');
}
function toggleNav() {
  const el = navEl();
  if (!el) return;
  const isActive = el.getAttribute('data-navigation-status') === 'active';
  el.setAttribute('data-navigation-status', isActive ? 'not-active' : 'active');
}

function updateActiveNavLinks(pathname = location.pathname) {
  const links = document.querySelectorAll(NAV_LINK_SEL);
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const url = new URL(href, location.origin);
    const isActive = url.pathname === pathname;
    a.classList.toggle('w--current', isActive);
    if (isActive) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
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

  // Close on nav link click (Barba will handle SPA navigation)
  document.querySelectorAll(NAV_LINK_SEL).forEach((a) => {
    a.addEventListener('click', () => closeNav(), { signal: ac.signal });
  });
}

// ------------------------------------
// Global: Filter drawer (GSAP)
// ------------------------------------
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

  gsap.set(drawer, { display: 'none', opacity: 0 });
  gsap.set(controls, { xPercent: 100 });

  if (openBtn) {
    openBtn.addEventListener(
      'click',
      () => {
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
          onComplete: () => gsap.set(drawer, { display: 'none' }),
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

// ------------------------------------
// Page modules
// ------------------------------------
const PageState = new Map();
const setState = (ns, obj) => PageState.set(ns, obj);
const getState = (ns) => PageState.get(ns) || {};
const clearState = (ns) => PageState.delete(ns);

// Home: Swiper + GSAP SplitText slider
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

  // Slider module (adapted from your code, functionality unchanged)
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
    const img = active?.querySelector('.slider-img');
    if (img) {
      gsap.fromTo(
        img,
        { scale: 1.12 },
        { scale: 1, duration: 1.0, ease: 'power2.out' }
      );
    }
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
        introFirstSlide(sw);
        scheduleAutoplay(() => transitionTo(sw, 'next'));
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
    },
  });
}

// Collections: InfiniteScrollProductFilter + Nice Select + filter drawer
async function initCollections(nsCtx) {
  // GSAP for filter drawer, Nice Select assets
  if (!window.gsap) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'
    );
  }
  await loadStyle(
    // Your page already customizes .nice-select; load CSS for the control
    'https://cdn.jsdelivr.net/npm/nice-select2@2.1.0/dist/css/nice-select2.css'
  );
  if (!window.NiceSelect) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/nice-select2@2.1.0/dist/js/nice-select2.js'
    );
  }

  // If no filter markup (product grid), skip
  const grid = document.querySelector('.product-grid');
  const form = document.getElementById('filters');
  if (!grid || !form) {
    setState('collections', { destroy: () => {} });
    return;
  }

  // Filter drawer listeners (idempotent)
  setupFilterListeners();

  // Class adapted from your code, with cleanup support (no behavior change)
  class InfiniteScrollProductFilter {
    constructor() {
      this.productContainer = document.querySelector('.product-grid');
      this.filterForm = document.getElementById('filters');
      this.sortDropdown = document.getElementById('sort-select');
      this.resultsCounter = document.querySelector('[data-results-count]');
      this.clearButton = document.querySelector('.button.alt');

      this.collectionId = 'c09bba8e-4a81-49c2-b722-f1fa46c75861';
      this.baseUrl =
        'https://wmkcwljhyweqzjivbupx.supabase.co/functions/v1/generic-collection-filter';

      this.activeFilters = {};
      this.currentSort = 'recommended';
      this.currentPage = 1;
      this.itemsPerPage = 30;
      this.isLoading = false;
      this.hasMorePages = true;
      this.totalItems = 0;
      this.niceSelect = null;

      // Added: lifecycle
      this._ac = new AbortController();
      this._observer = null;
      this._sentinel = null;

      this.init();
    }

    async init() {
      try {
        this.initNiceSelect();
        this.loadFromURLParams();
        this.initEventListeners();
        this.initInfiniteScroll();
        await this.loadInitialData();
      } catch (error) {
        console.error('Error initializing filter:', error);
        this.handleError(error);
      }
    }

    async loadInitialData() {
      this.currentPage = 1;
      this.hasMorePages = true;
      this.clearProductContainer();
      await this.fetchItems();
    }

    async fetchItems(append = false) {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const url = this.buildRequestUrl();
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await this.handleResponse(response);
        if (append) {
          this.appendItems(data.items);
        } else {
          this.renderItems(data.items);
        }
        this.updatePagination(data.pagination);
        this.updateResultsCounter(data.pagination.total);
        this.updateClearButton();
      } catch (error) {
        console.error('Fetch error:', error);
        this.handleError(error);
      } finally {
        this.isLoading = false;
      }
    }

    async handleResponse(response) {
      const text = await response.text();
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Please contact support.');
        }
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Invalid response format from server');
      }
    }

    buildRequestUrl() {
      const params = new URLSearchParams({
        collection_id: this.collectionId,
        page: this.currentPage.toString(),
        limit: this.itemsPerPage.toString(),
        sort: this.currentSort,
      });

      Object.entries(this.activeFilters).forEach(
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

    renderItems(items) {
      this.productContainer.innerHTML = '';
      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const el = this.createProductElement(item);
        el.style.opacity = '0';
        fragment.appendChild(el);
      });
      this.productContainer.appendChild(fragment);
      this.initImageHover();
      this.animateItemsIn();
      this.updateProductImages();
      this.updateProductLinks();
    }

    appendItems(items) {
      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const el = this.createProductElement(item);
        el.style.opacity = '0';
        fragment.appendChild(el);
      });
      this.productContainer.appendChild(fragment);
      this.initImageHover();

      const newItems = Array.from(this.productContainer.children).slice(
        -items.length
      );
      newItems.forEach((item, index) => {
        setTimeout(() => {
          item.style.transition =
            'opacity 0.4s ease-out, transform 0.4s ease-out';
          item.style.opacity = '1';
        }, index * 20);
      });

      setTimeout(() => {
        this.updateProductImages();
        this.updateProductLinks();
      }, 20);
    }

    createProductElement(item) {
      const productName =
        item.name || item['actual-product-name'] || 'Untitled';
      const mainImage = item.image?.url || null;
      const productSlug = item.slug || item.webflow_item_id || '';
      const baseUrl = `/collections/${productSlug}`;

      const productItem = document.createElement('div');
      productItem.setAttribute('role', 'listitem');
      productItem.className = 'w-dyn-item';
      productItem.style.opacity = '1';

      productItem.innerHTML = `
        <div class="collection_grid-item" data-base-url="${baseUrl}" style="opacity: 1; view-transition-name: ${productSlug};" data-hover-initialized="false">
          <a href="${baseUrl}" class="collection_image-cover" style="display: block; color: inherit; text-decoration: none;">
            <img src="https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg" loading="lazy" alt="" class="thumbnail-cover-img overlay-1">
            <img src="https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg" loading="lazy" alt="" class="thumbnail-cover-img overlay-2">
            ${this.createProgressiveBlurHTML(mainImage, productName)}
          </a>
          <div class="gradient-cover"></div>
          <div class="collection-overlay">
            <a href="${baseUrl}" class="collection_details" style="display: block; text-decoration: none;">
              <div class="truncate">${productName}</div>
            </a>
            ${this.createProductMetaHTML(item)}
            ${this.createVariantThumbnailsHTML(item.related_items, baseUrl)}
          </div>
        </div>
      `;
      return productItem;
    }

    createProgressiveBlurHTML(imageSrc, imageAlt) {
      const safeImageSrc =
        imageSrc ||
        'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
      const safeImageAlt = imageAlt || 'product-image';
      return `
        <div class="progressive-img-blur w-embed">
          <div class="blur-img">
            <div class="progressive-blur" style="--bg: url('${safeImageSrc}');" data-original-bg="${safeImageSrc}">
              <div class="blur"></div>
              <div class="blur"></div>
              <div class="blur"></div>
              <div class="blur"></div>
            </div>
            <img src="${safeImageSrc}" alt="${safeImageAlt}" data-original-src="${safeImageSrc}" data-original-alt="${safeImageAlt}">
          </div>
          <style>
            .blur-img { position: absolute; inset: 0; overflow: hidden; border-radius: 0px; width: 100%; height: 100%; z-index: 0; transition: opacity 0.2s; }
            .blur-img.top { z-index: 1; }
            .blur-img img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.06); }
            .progressive-blur { position: absolute; z-index: 6; width: 100%; height: 100%; pointer-events: none; inset: auto 0 0 0; transform: scale(1.06); }
            .blur { background: var(--bg); background-size: cover; position: absolute; background-position: center center; inset: 0; }
            .progressive-blur>div:nth-child(1) { filter: blur(2px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,1) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 88%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,1) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 88%); z-index: 1; }
            .progressive-blur>div:nth-child(2) { filter: blur(4px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 94%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 76%, rgba(0,0,0,1) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 94%); z-index: 2; }
            .progressive-blur>div:nth-child(3) { filter: blur(8px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 82%, rgba(0,0,0,1) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,0) 100%); z-index: 3; }
            .progressive-blur>div:nth-child(4) { filter: blur(16px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,1) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 88%, rgba(0,0,0,1) 94%, rgba(0,0,0,1) 100%); z-index: 4; }
            .progressive-blur>div:nth-child(5) { filter: blur(32px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 94%, rgba(0,0,0,1) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 94%, rgba(0,0,0,1) 100%); z-index: 5; }
          </style>
        </div>
      `;
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
          const imageSrc =
            variant['image-3']?.url ||
            'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
          const finishes = variant['finish-slugs'] || '';
          const color = this.extractColorName(variant.color, variant.slug);
          const sizes = variant['size-slugs'] || '';
          const name =
            variant.name || variant.slug || variant.webflow_item_id || '';
          const variantSlug = variant.slug || variant.webflow_item_id || '';
          const variantUrl = variantSlug
            ? `${baseUrl}?variant=${variantSlug}`
            : baseUrl;
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

    extractColorName(colorId, slug) {
      const colorMap = {
        blue: 'blue',
        green: 'green',
        black: 'black',
        white: 'white',
        grey: 'grey',
        gray: 'grey',
      };
      const lowerSlug = (slug || '').toLowerCase();
      for (const [key, value] of Object.entries(colorMap)) {
        if (lowerSlug.includes(key)) return value;
      }
      return colorId || '';
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

    updateFilters() {
      this.activeFilters = {};
      const checkedInputs = this.filterForm.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      checkedInputs.forEach((input) => {
        const filterTypeRaw = input.name;
        const filterValue = input.value;
        const filterType = this.normalizeFilterKey(filterTypeRaw);
        if (!this.activeFilters[filterType]) {
          this.activeFilters[filterType] = [];
        }
        this.activeFilters[filterType].push(filterValue);
      });
      this.updateFilterChips();
    }

    async applyFilters() {
      await this.loadInitialData();
      this.updateURLParams();
      this.updateProductLinks();
    }

    updateProductImages() {
      const colorFilters =
        this.activeFilters.colors || this.activeFilters.color;
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

    createBlurImageOverlay(imageSrc, imageAlt) {
      return `
        <div class="blur-img top" style="opacity: 0; transition: opacity 0.3s ease;">
          <div class="progressive-blur" style="--bg: url('${imageSrc}');">
            <div class="blur"></div>
            <div class="blur"></div>
            <div class="blur"></div>
            <div class="blur"></div>
          </div>
          <img src="${imageSrc}" alt="${imageAlt}">
        </div>
      `;
    }

    showImageOverlay(product, imageSrc, imageAlt, isPermanent = false) {
      const imageContainer =
        product.querySelector('.progressive-img-blur');
      if (!imageContainer) return;

      const existingOverlay = imageContainer.querySelector('.blur-img.top');
      if (existingOverlay) {
        existingOverlay.style.opacity = '0';
        setTimeout(() => existingOverlay.remove(), 10);
      }

      setTimeout(() => {
        const overlayHTML = this.createBlurImageOverlay(
          imageSrc,
          imageAlt
        );
        const mainBlurImg = imageContainer.querySelector(
          '.blur-img:not(.top)'
        );
        if (!mainBlurImg) return;
        mainBlurImg.insertAdjacentHTML('afterend', overlayHTML);
        const newOverlay = imageContainer.querySelector('.blur-img.top');
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
      }, isPermanent ? 0 : 50);
    }

    hideImageOverlay(product) {
      const imageContainer =
        product.querySelector('.progressive-img-blur');
      if (!imageContainer) return;
      const overlay = imageContainer.querySelector('.blur-img.top');
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
      const mainImg = product.querySelector('.blur-img:not(.top) img');
      const progressiveBlur = product.querySelector(
        '.blur-img:not(.top) .progressive-blur'
      );
      if (mainImg) {
        mainImg.src = imageSrc;
        mainImg.alt = imageAlt;
      }
      if (progressiveBlur) {
        progressiveBlur.style.setProperty('--bg', `url('${imageSrc}')`);
      }
    }

    restoreOriginalImage(product) {
      const mainImg = product.querySelector('.blur-img:not(.top) img');
      const progressiveBlur = product.querySelector(
        '.blur-img:not(.top) .progressive-blur'
      );
      const permanentOverlay = product.querySelector(
        '.blur-img.top[data-permanent]'
      );
      if (!mainImg || !progressiveBlur) return;

      const originalSrc = mainImg.dataset.originalSrc;
      const originalAlt = mainImg.dataset.originalAlt;
      const originalBg = progressiveBlur.dataset.originalBg;

      if (originalSrc && originalBg) {
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

    animateItemsIn() {
      const items =
        this.productContainer.querySelectorAll('.w-dyn-item');
      items.forEach((item, index) => {
        setTimeout(() => {
          item.style.transition =
            'opacity 0.4s ease-out, transform 0.4s ease-out';
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, index * 20);
      });
    }

    initImageHover() {
      const currentProducts = document.querySelectorAll(
        '.collection_grid-item'
      );
      currentProducts.forEach((product) => {
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
          });
          thumbnailContainer.addEventListener('mouseleave', () => {
            isHoveringThumbnails = false;
            hideTimeout = setTimeout(() => {
              this.hideImageOverlay(product);
            }, 200);
          });
        }

        variantThumbs.forEach((thumb) => {
          thumb.addEventListener('mouseenter', () => {
            if (hideTimeout) {
              clearTimeout(hideTimeout);
              hideTimeout = null;
            }
            const permanentOverlay = product.querySelector(
              '.blur-img.top[data-permanent]'
            );
            if (!permanentOverlay) {
              this.showImageOverlay(product, thumb.src, thumb.alt, false);
            }
          });

          thumb.addEventListener('mouseleave', () => {
            if (!isHoveringThumbnails) {
              hideTimeout = setTimeout(() => {
                this.hideImageOverlay(product);
              }, 200);
            }
          });
        });

        product.dataset.hoverInitialized = 'true';
      });
    }

    initProductNavigation() {
      // intentionally not used (native links handle nav)
    }

    getVariantsForColor(gridItem, colorFilter) {
      const variantThumbs = gridItem.querySelectorAll('.variant-thumb');
      const matching = [];
      variantThumbs.forEach((thumb) => {
        const meta = thumb.nextElementSibling;
        if (!meta || !meta.classList.contains('variant-meta')) return;
        const colors = meta.getAttribute('data-color');
        const variantSlug = meta.getAttribute('data-slug');
        if (!colors || !variantSlug) return;
        const variantColors = colors
          .split(',')
          .map((c) => c.trim().toLowerCase());
        if (variantColors.includes(colorFilter)) matching.push(variantSlug);
      });
      return matching;
    }

    updateProductLinks() {
      const colorFilters =
        this.activeFilters.colors || this.activeFilters.color;
      const currentProducts = document.querySelectorAll(
        '.collection_grid-item'
      );
      currentProducts.forEach((product) => {
        const baseUrl = product.dataset.baseUrl;
        if (!baseUrl) return;
        let mainUrl = baseUrl;
        if (colorFilters && colorFilters.length === 1) {
          const matching = this.getVariantsForColor(
            product,
            colorFilters[0].toLowerCase()
          );
          if (matching.length === 1) {
            mainUrl = `${baseUrl}?variant=${matching[0]}`;
          }
        }
        const imageCover = product.querySelector('.collection_image-cover');
        const details = product.querySelector('.collection_details');
        if (imageCover && imageCover.tagName === 'A') imageCover.href = mainUrl;
        if (details && details.tagName === 'A') details.href = mainUrl;
      });
    }

    initNiceSelect() {
      if (this.sortDropdown && typeof NiceSelect !== 'undefined') {
        try {
          this.niceSelect = NiceSelect.bind(this.sortDropdown, {
            searchable: false,
            placeholder: 'Select...',
            searchtext: 'Search',
            selectedtext: 'geselecteerd',
          });
        } catch (error) {
          console.error('Failed to initialize Nice Select 2:', error);
        }
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

    initEventListeners() {
      if (this.filterForm) {
        this.filterForm.addEventListener(
          'change',
          async (e) => {
            if (e.target.type === 'checkbox') {
              this.updateFilters();
              await this.applyFilters();
            }
          },
          { signal: this._ac.signal }
        );
      }

      if (this.sortDropdown) {
        this.sortDropdown.addEventListener(
          'change',
          async (e) => {
            this.currentSort = e.target.value;
            await this.applyFilters();
          },
          { signal: this._ac.signal }
        );
      }

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

      this.initFilterChipEvents();
    }

    initInfiniteScroll() {
      this._observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              this.hasMorePages &&
              !this.isLoading
            ) {
              this.currentPage++;
              this.fetchItems(true);
            }
          });
        },
        { rootMargin: '100px', threshold: 0.1 }
      );

      this._sentinel = document.createElement('div');
      this._sentinel.style.height = '1px';
      this._sentinel.style.position = 'absolute';
      this._sentinel.style.bottom = '100px';
      this._sentinel.style.width = '100%';

      if (this.productContainer && this.productContainer.parentNode) {
        this.productContainer.parentNode.appendChild(this._sentinel);
        this._observer.observe(this._sentinel);
      }
    }

    updatePagination(pagination) {
      if (pagination) {
        this.totalItems = pagination.total || 0;
        this.hasMorePages = pagination.hasMore || false;
      }
    }

    updateURLParams() {
      const params = new URLSearchParams();
      Object.entries(this.activeFilters).forEach(
        ([filterType, filterValues]) => {
          if (filterValues.length > 0) {
            params.set(filterType, filterValues.join(','));
          }
        }
      );
      if (this.currentSort !== 'recommended') {
        params.set('sort', this.currentSort);
      }
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    loadFromURLParams() {
      const params = new URLSearchParams(window.location.search);
      const sortParam = params.get('sort');
      if (sortParam) {
        this.currentSort = sortParam;
        this.updateNiceSelect(sortParam);
      }
      const aliasMap = {
        color: ['color', 'colors', 'Color', 'Colors'],
        colors: ['colors', 'color', 'Colors', 'Color'],
        size: ['size', 'sizes', 'Size', 'Sizes'],
        sizes: ['sizes', 'size', 'Sizes', 'Size'],
        finish: ['finish', 'finishes', 'Finish', 'Finishes'],
        finishes: ['finishes', 'finish', 'Finishes', 'Finish'],
        application: [
          'application',
          'applications',
          'Application',
          'Applications',
        ],
        applications: [
          'applications',
          'application',
          'Applications',
          'Application',
        ],
        'application-slugs': [
          'application',
          'applications',
          'Application',
          'Applications',
        ],
        material: [
          'material',
          'materials',
          'Material',
          'Materials',
          'material-type',
          'materialtype',
        ],
        materials: [
          'materials',
          'material',
          'Materials',
          'Material',
          'material-type',
          'materialtype',
        ],
        thickness: ['thickness', 'Thickness'],
      };
      let filtersApplied = false;
      for (const [key, value] of params.entries()) {
        if (
          ['sort', 'page', 'limit', 'config', 'collection_id'].includes(key)
        )
          continue;
        if (!value) continue;
        const values = value.split(',');
        const candidateNames = aliasMap[key] || [key];
        values.forEach((v) => {
          let checkbox = null;
          for (const name of candidateNames) {
            checkbox = this.filterForm?.querySelector(
              `input[name="${name}"][value="${v}"]`
            );
            if (checkbox) break;
          }
          if (checkbox) {
            checkbox.checked = true;
            filtersApplied = true;
          }
        });
      }
      if (filtersApplied) this.updateFilters();
      else this.updateFilterChips();
    }

    updateResultsCounter(count) {
      if (this.resultsCounter) this.resultsCounter.textContent = count;
    }

    updateClearButton() {
      if (this.clearButton) {
        const has = Object.keys(this.activeFilters).length > 0;
        this.clearButton.style.opacity = has ? '1' : '0.5';
        this.clearButton.disabled = !has;
      }
    }

    async clearAllFilters() {
      const checkboxes = this.filterForm.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      checkboxes.forEach((checkbox) => (checkbox.checked = false));
      this.currentSort = 'recommended';
      this.updateNiceSelect('recommended');
      this.updateFilters();
      await this.applyFilters();
    }

    clearProductContainer() {
      if (this.productContainer) this.productContainer.innerHTML = '';
    }

    updateFilterChips() {
      const chipContainer = document.querySelector('.filter-chip-group');
      if (!chipContainer) return;
      chipContainer.innerHTML = '';
      Object.entries(this.activeFilters).forEach(
        ([filterType, filterValues]) => {
          filterValues.forEach((value) => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-chip-value', value);
            chip.setAttribute('data-chip-filter', filterType);
            const displayValue = this.getDisplayValueForFilter(
              value,
              filterType
            );
            chip.innerHTML = `
              <div class="remove-btn"><div class="text-block-4">x</div></div>
              <div>${displayValue}</div>
            `;
            chipContainer.appendChild(chip);
          });
        }
      );
    }

    getDisplayValueForFilter(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
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
        this.updateFilters();
        await this.applyFilters();
      }
    }

    handleError(error) {
      console.error('Filter error:', error);
      if (this.productContainer) {
        this.productContainer.innerHTML = `
          <div class="error-message" style="grid-column:1 / -1; text-align:center; padding:2rem; background:#fee; border:1px solid #fcc; border-radius:8px; color:#c33;">
            <h3>Error loading products</h3>
            <p>${error.message}</p>
            <button onclick="window.location.reload()" style="margin-top:1rem; padding:0.5rem 1rem; background:#c33; color:white; border:none; border-radius:4px; cursor:pointer;">Reload Page</button>
          </div>
        `;
      }
    }

    // Added destroy for cleanup between Barba views
    destroy() {
      try {
        this._ac?.abort?.();
      } catch (e) {}
      try {
        this._observer?.disconnect?.();
      } catch (e) {}
      try {
        this._sentinel?.remove?.();
      } catch (e) {}
    }
  }

  const filterInstance = new InfiniteScrollProductFilter();
  // Keep available (as before) but replace if re-entering
  window.productFilter = filterInstance;

  setState('collections', {
    destroy: () => {
      try {
        filterInstance.destroy();
      } catch (e) {}
    },
  });
}

// Product: Fancyapps Carousel + Fancybox
async function initProduct(nsCtx) {
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
    setState('product', { destroy: () => {} });
    return;
  }

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
        // Factory style (as in your code)
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
  setState('product', { destroy: () => ps.destroy() });
}

// ------------------------------------
// Barba setup
// ------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Nav (persistent)
  initScalingHamburgerNavigation();
  updateActiveNavLinks();

  if (!window.barba || !barba.init) {
    console.error('Barba not found. Include @barba/core before this script.');
    return;
  }

  barba.init({
    prevent: ({ el }) => el?.hasAttribute?.('data-no-barba'),
    transitions: [
      {
        name: 'fade',
        leave({ current }) {
          if (window.gsap) {
            return gsap.to(current.container, {
              opacity: 0,
              duration: 0.2,
              ease: 'power1.out',
            });
          }
        },
        enter({ next }) {
          if (window.gsap) {
            next.container.style.opacity = 0;
            return gsap.to(next.container, {
              opacity: 1,
              duration: 0.2,
              ease: 'power1.out',
            });
          }
        },
      },
    ],
    views: [
      {
        namespace: 'home',
        beforeLeave() {
          getState('home')?.destroy?.();
          clearState('home');
        },
        async afterEnter() {
          await initHome();
        },
      },
      {
        namespace: 'collections',
        beforeLeave() {
          getState('collections')?.destroy?.();
          clearState('collections');
        },
        async afterEnter() {
          await initCollections();
        },
      },
      {
        namespace: 'product',
        beforeLeave() {
          getState('product')?.destroy?.();
          clearState('product');
        },
        async afterEnter() {
          await initProduct();
        },
      },
    ],
  });

  // Close nav at start of any transition
  barba.hooks.before(() => {
    closeNav();
  });

  // After each enter: update active nav, re-init Webflow, generic UI init
  barba.hooks.afterEnter((ctx) => {
    const path = ctx?.next?.url?.path || location.pathname;
    updateActiveNavLinks(path);
    reinitWebflow();
    initButtonCharacterStagger();
    // Optional: reset scroll to top on each nav
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

  // First load
  initButtonCharacterStagger();
  reinitWebflow();

  const firstNs = document
    .querySelector('[data-barba="container"]')
    ?.getAttribute('data-barba-namespace');

  if (firstNs === 'home') {
    initHome();
  } else if (firstNs === 'collections') {
    initCollections();
  } else if (firstNs === 'product') {
    initProduct();
  }
});