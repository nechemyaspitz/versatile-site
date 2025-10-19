// Main entry point - Taxi.js SPA
import { initTaxi } from './taxi.js';

const VERSION = '4.7.6';

console.log(`Versatile Site v${VERSION}`);
console.log('Site by nechemya.dev');
console.log('https://nechemya.dev');

// Initialize immediately if DOM is ready, otherwise wait
function init() {
  const taxi = initTaxi();
  
  if (!taxi) {
    console.error('Taxi.js failed to initialize');
  }
}

if (document.readyState === 'loading') {
  // DOM is still loading, wait for it
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already ready, init immediately
  init();
}
