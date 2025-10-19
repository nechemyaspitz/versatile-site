// Main entry point - Taxi.js SPA
import { initTaxi } from './taxi.js';

const VERSION = '4.6.8';

console.log(`Versatile Site v${VERSION}`);
console.log('Site by nechemya.dev');
console.log('https://nechemya.dev');

document.addEventListener('DOMContentLoaded', () => {
  const taxi = initTaxi();
  
  if (!taxi) {
    console.error('Taxi.js failed to initialize');
  }
});
