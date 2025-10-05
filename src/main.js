// Main entry point - Taxi.js SPA (SIMPLER & FASTER!)
import { initTaxi } from './taxi.js';

// Version tracking
const VERSION = '2.0.3';
const DEPLOY_TIME = new Date().toISOString();

console.log(`%c🚕 Versatile Site v${VERSION} - Powered by Taxi.js`, 'color: #00ff00; font-weight: bold; font-size: 16px;');
console.log(`%c✅ Loaded from GitHub Pages`, 'color: #00aaff; font-weight: bold;');
console.log(`%c📦 Deploy time: ${DEPLOY_TIME}`, 'color: #ffaa00;');
console.log(`%c🔍 v2.0.3: DEBUG MODE - Checking Taxi.js availability!`, 'color: #ff6600; font-weight: bold;');

// Debug: Log what's available on window
console.log('%c🔍 DEBUG: Checking what\'s loaded...', 'color: #ff00ff; font-weight: bold;');
console.log('window.Taxi:', typeof window.Taxi);
console.log('window.Taxi keys:', window.Taxi ? Object.keys(window.Taxi) : 'undefined');

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🚕 Taxi.js initializing...', 'color: #ff00ff;');
  console.log('%c🔍 window.Taxi available?', 'color: #ff00ff;', !!window.Taxi);
  
  if (window.Taxi) {
    console.log('%c✅ Taxi.js found! Keys:', 'color: #00ff00;', Object.keys(window.Taxi));
  }
  
  const taxi = initTaxi();
  
  // Expose for debugging
  window.taxi = taxi;
});

