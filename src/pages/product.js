// Product page: Fancyapps Carousel + Fancybox
import { loadScript, loadStyle } from '../utils/assetLoader.js';
import { setState } from '../core/state.js';

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

export async function initProduct(nsCtx) {
  // Load Fancyapps styles and scripts (GSAP + SplitText are already globally available)
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
  
  // Small delay to ensure plugins are fully registered (needed on fresh page load)
  await new Promise(resolve => setTimeout(resolve, 50));

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
        // Factory style - explicitly reference from window to ensure plugins are available
        this.carousel = Carousel(
          carouselContainer,
          {
            infinite: true,
            center: true,
            fill: true,
            dragFree: false,
            initialPage: this.initialSlideIndex,
          },
          { Arrows: window.Arrows, Thumbs: window.Thumbs }
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

