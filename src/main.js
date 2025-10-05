// Main entry point - Barba.js SPA with modular architecture
import { initBarba } from './core/barbaManager.js';

// Version tracking for deployment verification
const VERSION = '1.0.1';
const DEPLOY_TIME = new Date().toISOString();

console.log(`%c🚀 Versatile Site SPA v${VERSION}`, 'color: #00ff00; font-weight: bold; font-size: 16px;');
console.log(`%c✅ Loaded from GitHub CDN`, 'color: #00aaff; font-weight: bold;');
console.log(`%c📦 Deploy time: ${DEPLOY_TIME}`, 'color: #ffaa00;');

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🎯 Barba.js initializing...', 'color: #ff00ff;');
  initBarba();
});

