// About page logic
export async function initAbout() {
  // Reveal page immediately
  const view = document.querySelector('[data-taxi-view="about"]');
  if (view) {
    view.style.opacity = '1';
    if (window.gsap) {
      window.gsap.set(view, { opacity: 1, force3D: false });
    }
  }
  
  // Wait for fonts to load before any potential SplitText usage
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  
  // Future: Add scroll animations or other interactions here
}

