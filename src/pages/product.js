// Product page: Fancyapps Carousel + Fancybox
import { loadScript, loadStyle } from '../utils/assetLoader.js';
import { setState } from '../core/state.js';

export async function initProduct(nsCtx) {
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
  setState('product', { destroy: () => ps.destroy() });
}

