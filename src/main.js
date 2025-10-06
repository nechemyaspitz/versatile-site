// Main entry point - Taxi.js SPA (SIMPLER & FASTER!)
import { initTaxi } from './taxi.js';
import { initLenis } from './utils/lenis.js';

// Version tracking
const VERSION = '3.1.0';
const DEPLOY_TIME = new Date().toISOString();

console.log(`%c🚕 Versatile Site v${VERSION} - Powered by Taxi.js + Lenis`, 'color: #00ff00; font-weight: bold; font-size: 16px;');
console.log(`%c✅ Loaded from GitHub Pages`, 'color: #00aaff; font-weight: bold;');
console.log(`%c📦 Deploy time: ${DEPLOY_TIME}`, 'color: #ffaa00;');
console.log(`%c🎉 v3.1.0: Added Lenis smooth scrolling!`, 'color: #ff6600; font-weight: bold;');

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🎯 Initializing application...', 'color: #ff00ff;');
  
  // Initialize Lenis smooth scrolling
  const lenis = initLenis();
  
  // Initialize Taxi.js
  const taxi = initTaxi();
  
  if (taxi) {
    console.log('%c🚀 Taxi.js ready! Navigation enabled.', 'color: #00ff00; font-weight: bold;');
  } else {
    console.error('%c❌ Taxi.js failed to initialize!', 'color: #ff0000; font-weight: bold;');
  }
  
  // Expose for debugging
  window.taxi = taxi;
  window.lenis = lenis;
});
