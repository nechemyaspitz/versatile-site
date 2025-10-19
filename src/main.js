// Main entry point - Taxi.js SPA
import { initTaxi } from './taxi.js';

const VERSION = '4.6.6';

console.log(`Versatile Site v${VERSION}`);
console.log('%cSite by nechemya.dev', 'color: #00aaff; font-weight: bold;');
console.log('https://nechemya.dev');

document.addEventListener('DOMContentLoaded', () => {
  const taxi = initTaxi();
  
  if (!taxi) {
    console.error('Taxi.js failed to initialize');
  }
});
