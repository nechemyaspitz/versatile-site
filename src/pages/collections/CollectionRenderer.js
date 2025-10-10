/**
 * CollectionRenderer.js
 * Handles all DOM rendering and animations
 * Creates elements, manages skeletons, animates items
 */

export class CollectionRenderer {
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
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
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

