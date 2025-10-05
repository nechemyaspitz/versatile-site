// Morph transition - for collections → product
import { Transition } from '@unseenco/taxi';

export default class MorphTransition extends Transition {
  /**
   * Check if this transition should be used
   */
  static shouldTransition({ from, to }) {
    // Use morph when going from collections to product
    const fromCollections = from.page.view === 'collections';
    const toProduct = to.page.view === 'product';
    
    return fromCollections && toProduct;
  }
  
  /**
   * Animate out (collections page)
   */
  onLeave({ from, done }) {
    console.log('🎬 Morph transition: Leaving collections');
    
    // Get stored morph data
    const morphData = sessionStorage.getItem('morphFrom');
    if (!morphData) {
      // Fallback to simple fade
      gsap.to(from, {
        opacity: 0,
        duration: 0.3,
        onComplete: done,
      });
      return;
    }
    
    const { rect } = JSON.parse(morphData);
    
    // Create clone of clicked item
    const clone = document.createElement('div');
    clone.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: #f0f0f0;
      border-radius: 8px;
      z-index: 9999;
      pointer-events: none;
    `;
    clone.setAttribute('data-morph-clone', 'true');
    document.body.appendChild(clone);
    
    // Store clone reference
    this.clone = clone;
    
    // Fade out collections
    gsap.to(from, {
      opacity: 0,
      duration: 0.2,
      onComplete: done,
    });
  }
  
  /**
   * Animate in (product page)
   */
  onEnter({ to, done }) {
    console.log('🎬 Morph transition: Entering product');
    
    if (!this.clone || !window.gsap) {
      gsap.set(to, { opacity: 1 });
      done();
      return;
    }
    
    // Find product slider
    const slider = to.querySelector('.slider-wrap');
    if (!slider) {
      // Cleanup and fallback
      this.clone.remove();
      gsap.set(to, { opacity: 1 });
      done();
      return;
    }
    
    // Get slider position
    const sliderRect = slider.getBoundingClientRect();
    const cloneRect = this.clone.getBoundingClientRect();
    
    // Calculate transform
    const scaleX = cloneRect.width / sliderRect.width;
    const scaleY = cloneRect.height / sliderRect.height;
    const translateX = cloneRect.left - sliderRect.left;
    const translateY = cloneRect.top - sliderRect.top;
    
    // Set initial state
    gsap.set(to, { opacity: 1 });
    gsap.set(slider, {
      x: translateX,
      y: translateY,
      scaleX,
      scaleY,
      transformOrigin: 'top left',
    });
    
    // Animate morph
    const tl = gsap.timeline({
      onComplete: () => {
        this.clone.remove();
        sessionStorage.removeItem('morphFrom');
        done();
      },
    });
    
    // Fade out clone
    tl.to(this.clone, {
      opacity: 0,
      duration: 0.3,
    }, 0);
    
    // Morph slider to position
    tl.to(slider, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.6,
      ease: 'power3.inOut',
      clearProps: 'all',
    }, 0);
  }
}

