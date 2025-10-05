// Main entry point - Barba.js SPA with modular architecture
import { initBarba } from './core/barbaManager.js';

// Version tracking for deployment verification
const VERSION = '1.1.0';
const DEPLOY_TIME = new Date().toISOString();

console.log(`%c🚀 Versatile Site SPA v${VERSION}`, 'color: #00ff00; font-weight: bold; font-size: 16px;');
console.log(`%c✅ Loaded from GitHub CDN`, 'color: #00aaff; font-weight: bold;');
console.log(`%c📦 Deploy time: ${DEPLOY_TIME}`, 'color: #ffaa00;');
console.log(`%c✨ NEW: GSAP Flip morph animations + Performance optimizations`, 'color: #ff6600; font-weight: bold;');

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🎯 Barba.js initializing...', 'color: #ff00ff;');
  initBarba();
});

