// About page logic
export async function initAbout() {
  // Wait for fonts to load before any potential SplitText usage
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  
  // Future: Add scroll animations or other interactions here
}

