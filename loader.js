// Smart loader: tries local dev server first, falls back to production
(function() {
  const LOCAL_URL = 'http://localhost:8000/main.js';
  const PRODUCTION_URL = 'https://nechemyaspitz.github.io/versatile-site/main.js';
  
  // Try to load from local server first
  fetch(LOCAL_URL, { method: 'HEAD', cache: 'no-cache' })
    .then(response => {
      if (response.ok) {
        console.log('🔧 Loading LOCAL version');
        loadScript(LOCAL_URL);
      } else {
        console.log('🌐 Loading PRODUCTION version');
        loadScript(PRODUCTION_URL);
      }
    })
    .catch(() => {
      // Local server not running, use production
      console.log('🌐 Loading PRODUCTION version');
      loadScript(PRODUCTION_URL);
    });
  
  function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    // Don't use defer - execute immediately when loaded
    document.head.appendChild(script);
  }
})();

