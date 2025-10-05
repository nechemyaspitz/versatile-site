// Morph transition - GSAP Flip animation for collections ↔ product
// Factory function to create transition class when Taxi.js is loaded

export default function createMorphTransition() {
  if (!window.taxi) {
    console.error('taxi not loaded!');
    return class {}; // Return empty class as fallback
  }
  
  return class MorphTransition extends window.taxi.Transition {
    // Store clone element for transition
    clone = null;
    
    /**
     * Determine if this transition should be used
     * NOTE: Taxi.js doesn't support this method in the same way
     * We'll use routing instead in taxi.js initialization
     */
    
    /**
     * Leave: Animate out current page
     * @param {{ from: HTMLElement, trigger: string|HTMLElement|false, done: Function }} props
     */
    onLeave({ from, trigger, done }) {
      console.log('🎬 Morph: Leaving', { trigger });
      
      const isBackButton = trigger === 'popstate';
      
      if (isBackButton) {
        // Back button: Product → Collections (reverse morph)
        this.leaveProductPage(from, done);
      } else {
        // Forward: Collections → Product (forward morph)
        this.leaveCollectionsPage(from, done);
      }
    }
    
    /**
     * Enter: Animate in new page
     * @param {{ to: HTMLElement, trigger: string|HTMLElement|false, done: Function }} props
     */
    onEnter({ to, trigger, done }) {
      console.log('📥 Morph: Entering', { trigger });
      
      const isBackButton = trigger === 'popstate';
      
      if (isBackButton) {
        // Back button: Entering collections page (reverse morph)
        this.enterCollectionsPage(to, done);
      } else {
        // Forward: Entering product page (forward morph)
        this.enterProductPage(to, done);
      }
    }
    
    /**
     * FORWARD MORPH: Leave collections page
     */
    leaveCollectionsPage(from, done) {
      if (!window.gsap) {
        done();
        return;
      }
      
      const morphData = JSON.parse(sessionStorage.getItem('morphData') || 'null');
      if (!morphData) {
        console.warn('⚠️ No morph data, using default fade');
        gsap.to(from, { opacity: 0, duration: 0.3, onComplete: done });
        return;
      }
      
      // Find clicked item
      const clickedItem = from.querySelector(`[data-base-url="/collections/${morphData.slug}"]`);
      if (!clickedItem) {
        console.warn('⚠️ Clicked item not found');
        gsap.to(from, { opacity: 0, duration: 0.3, onComplete: done });
        return;
      }
      
      // Create clone
      this.clone = clickedItem.cloneNode(true);
      const rect = clickedItem.getBoundingClientRect();
      
      this.clone.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        margin: 0;
        z-index: 10000;
        pointer-events: none;
        border-radius: ${morphData.borderRadius};
        will-change: transform, opacity;
      `;
      
      document.body.appendChild(this.clone);
      
      console.log('✅ Clone created and positioned');
      
      // Hide original item
      gsap.set(clickedItem, { opacity: 0 });
      
      // Fade out other items
      const otherItems = from.querySelectorAll('.collection_grid-item');
      gsap.to(otherItems, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: done,
      });
    }
    
    /**
     * FORWARD MORPH: Enter product page
     */
    enterProductPage(to, done) {
      if (!window.gsap) {
        done();
        return;
      }
      
      const morphData = JSON.parse(sessionStorage.getItem('morphData') || 'null');
      const slider = to.querySelector('.slider-wrap');
      
      if (!morphData || !this.clone || !slider) {
        console.warn('⚠️ Missing morph elements, using default fade');
        gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.3, onComplete: done });
        if (this.clone) {
          this.clone.remove();
          this.clone = null;
        }
        return;
      }
      
      // Get positions
      const cloneRect = this.clone.getBoundingClientRect();
      const sliderRect = slider.getBoundingClientRect();
      
      // Calculate transform
      const scaleX = cloneRect.width / sliderRect.width;
      const scaleY = cloneRect.height / sliderRect.height;
      const translateX = cloneRect.left - sliderRect.left;
      const translateY = cloneRect.top - sliderRect.top;
      
      console.log('📐 Morph metrics:', { scaleX, scaleY, translateX, translateY });
      
      // Position slider at clone location instantly
      gsap.set(slider, {
        x: translateX,
        y: translateY,
        scaleX,
        scaleY,
        transformOrigin: 'top left',
        opacity: 1,
        borderRadius: morphData.borderRadius,
        willChange: 'transform, opacity',
      });
      
      // Make container visible
      gsap.set(to, { opacity: 1 });
      
      // Create synchronized timeline
      const tl = gsap.timeline({
        onComplete: () => {
          if (this.clone) {
            this.clone.remove();
            this.clone = null;
          }
          // Keep morphData for back navigation
          console.log('✅ Forward morph complete');
          done();
        },
      });
      
      // Fade out clone
      tl.to(this.clone, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      }, 0);
      
      // Morph slider to natural position
      tl.to(slider, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        borderRadius: window.getComputedStyle(slider).borderRadius,
        duration: 0.7,
        ease: 'power3.inOut',
        clearProps: 'transform,borderRadius,willChange',
      }, 0);
    }
    
    /**
     * REVERSE MORPH: Leave product page
     */
    leaveProductPage(from, done) {
      if (!window.gsap) {
        done();
        return;
      }
      
      const slider = from.querySelector('.slider-wrap');
      if (!slider) {
        gsap.to(from, { opacity: 0, duration: 0.3, onComplete: done });
        return;
      }
      
      // Just fade other content, keep slider visible
      const otherContent = from.querySelectorAll(':scope > *:not([data-taxi]):not(.slider-wrap)');
      
      gsap.to(otherContent, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: done,
      });
      
      console.log('✅ Product page content faded');
    }
    
    /**
     * REVERSE MORPH: Enter collections page
     */
    enterCollectionsPage(to, done) {
      if (!window.gsap) {
        done();
        return;
      }
      
      const morphData = JSON.parse(sessionStorage.getItem('morphData') || 'null');
      if (!morphData) {
        console.warn('⚠️ No morph data for reverse, using default fade');
        gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.3, onComplete: done });
        return;
      }
      
      // Find elements
      const productSlider = document.querySelector('.slider-wrap'); // Still in DOM during enter!
      const targetGrid = to.querySelector('.product-grid');
      
      if (!productSlider || !targetGrid) {
        console.warn('⚠️ Missing elements for reverse morph');
        gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.3, onComplete: done });
        sessionStorage.removeItem('morphData');
        return;
      }
      
      // Find target item
      const targetItem = targetGrid.querySelector(`[data-base-url="/collections/${morphData.slug}"]`);
      
      if (!targetItem) {
        console.warn('⚠️ Target item not found for reverse morph');
        gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.3, onComplete: done });
        sessionStorage.removeItem('morphData');
        return;
      }
      
      console.log('🔄 Reverse morph: Elements found', { slider: !!productSlider, target: !!targetItem });
      
      // Set up layering
      gsap.set(to, { opacity: 1 });
      gsap.set(targetItem, { opacity: 0 }); // Hide target during morph
      
      // Get positions
      const sliderRect = productSlider.getBoundingClientRect();
      const targetRect = targetItem.getBoundingClientRect();
      
      // Calculate transform
      const scaleX = targetRect.width / sliderRect.width;
      const scaleY = targetRect.height / sliderRect.height;
      const translateX = targetRect.left - sliderRect.left;
      const translateY = targetRect.top - sliderRect.top;
      
      console.log('📐 Reverse morph metrics:', { scaleX, scaleY, translateX, translateY });
      
      // Ensure slider is on top
      gsap.set(productSlider, { 
        zIndex: 10000,
        willChange: 'transform, opacity',
      });
      
      // Create timeline
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(productSlider, { clearProps: 'all' });
          sessionStorage.removeItem('morphData');
          console.log('✅ Reverse morph complete');
          done();
        },
      });
      
      // Morph slider to target position
      tl.to(productSlider, {
        x: translateX,
        y: translateY,
        scaleX,
        scaleY,
        transformOrigin: 'top left',
        borderRadius: morphData.borderRadius,
        duration: 0.6,
        ease: 'power3.inOut',
      }, 0);
      
      // Crossfade: Fade out slider
      tl.to(productSlider, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      }, 0.3);
      
      // Crossfade: Fade in target item
      tl.to(targetItem, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      }, 0.3);
      
      // Stagger in other items
      const otherItems = targetGrid.querySelectorAll(`.collection_grid-item:not([data-base-url="/collections/${morphData.slug}"])`);
      tl.fromTo(otherItems, 
        { opacity: 0 }, 
        { 
          opacity: 1, 
          duration: 0.4, 
          ease: 'power2.out',
          stagger: 0.03,
        }, 
        0.4
      );
    }
  };
}
