// Main entry point - Taxi.js SPA (SIMPLER & FASTER!)
import { initTaxi } from './taxi.js';

// Version tracking
const VERSION = '3.2.0';
const DEPLOY_TIME = new Date().toISOString();

console.log(`%c🚕 Versatile Site v${VERSION} - Powered by Taxi.js`, 'color: #00ff00; font-weight: bold; font-size: 16px;');
console.log(`%c✅ Loaded from GitHub Pages`, 'color: #00aaff; font-weight: bold;');
console.log(`%c📦 Deploy time: ${DEPLOY_TIME}`, 'color: #ffaa00;');
console.log(`%c🎉 v3.2.0: FIXED SCROLL JUMP! Body scroll locked during transitions.`, 'color: #00ff00; font-weight: bold;');
console.log(`%c✨ Smooth transitions without ANY scroll jumping!`, 'color: #ffaa00;');

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🎯 Initializing Taxi.js...', 'color: #ff00ff;');
  
  const taxi = initTaxi();
  
  if (taxi) {
    console.log('%c🚀 Taxi.js ready! Navigation enabled.', 'color: #00ff00; font-weight: bold;');
  } else {
    console.error('%c❌ Taxi.js failed to initialize!', 'color: #ff0000; font-weight: bold;');
  }
  
  // Expose for debugging
  window.taxi = taxi;
});
