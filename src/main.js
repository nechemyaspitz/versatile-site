// Main entry point - Taxi.js SPA
import { initTaxi } from './taxi.js';

const VERSION = '3.12.3-DEBUG';

console.log(`%c🚕 Versatile Site v${VERSION}`, 'color: #00ff00; font-weight: bold;');
console.log('%c🔧 FIX: Check view name to determine which exit animation', 'color: #00ff00;');

document.addEventListener('DOMContentLoaded', () => {
  const taxi = initTaxi();
  
  if (taxi) {
    console.log('%c✅ Taxi.js ready', 'color: #00ff00;');
    window.taxi = taxi; // Expose for debugging
  } else {
    console.error('%c❌ Taxi.js failed to initialize', 'color: #ff0000;');
  }
});
