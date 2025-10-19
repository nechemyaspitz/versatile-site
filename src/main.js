// Main entry point - Taxi.js SPA
import { initTaxi } from './taxi.js';

const VERSION = '4.6.2';

console.log(`Versatile Site v${VERSION}`);

document.addEventListener('DOMContentLoaded', () => {
  const taxi = initTaxi();
  
  if (!taxi) {
    console.error('Taxi.js failed to initialize');
  }
});
