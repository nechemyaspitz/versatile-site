// Main entry point - Taxi.js SPA
import { initTaxi } from './taxi.js';

const VERSION = '3.18.0-REFACTOR';

console.log(`%c🚕 Versatile Site v${VERSION}`, 'color: #00ff00; font-weight: bold;');
console.log('%c🔥 COMPLETE REFACTOR: URL-keyed cache (one entry per filter/sort state)', 'color: #ff00ff;');

document.addEventListener('DOMContentLoaded', () => {
  const taxi = initTaxi();
  
  if (taxi) {
    console.log('%c✅ Taxi.js ready', 'color: #00ff00;');
    window.taxi = taxi; // Expose for debugging
  } else {
    console.error('%c❌ Taxi.js failed to initialize', 'color: #ff0000;');
  }
});
