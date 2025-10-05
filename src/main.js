// Main entry point - Taxi.js SPA (SIMPLER & FASTER!)
import { initTaxi } from './taxi.js';

// Version tracking
const VERSION = '2.0.1';
const DEPLOY_TIME = new Date().toISOString();

console.log(`%c🚕 Versatile Site v${VERSION} - Powered by Taxi.js`, 'color: #00ff00; font-weight: bold; font-size: 16px;');
console.log(`%c✅ Loaded from GitHub Pages`, 'color: #00aaff; font-weight: bold;');
console.log(`%c📦 Deploy time: ${DEPLOY_TIME}`, 'color: #ffaa00;');
console.log(`%c🎉 v2.0.1: Fixed CDN imports - Now properly using window.Taxi!`, 'color: #ff6600; font-weight: bold;');

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🚕 Taxi.js initializing...', 'color: #ff00ff;');
  const taxi = initTaxi();
  
  // Expose for debugging
  window.taxi = taxi;
});

