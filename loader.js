// Local development loader - tries local first, falls back to GitHub Pages
(function() {
  const LOCAL_PATH = '/main.js';
  const GITHUB_PATH = 'https://nechemyaspitz.github.io/versatile-site/main.js';
  
  // Try loading local version first
  fetch(LOCAL_PATH, { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        // Local file exists, load it
        console.log('🔧 Loading LOCAL version of main.js');
        loadScript(LOCAL_PATH);
      } else {
        // Local file not found, load from GitHub
        console.log('🌐 Loading PRODUCTION version from GitHub Pages');
        loadScript(GITHUB_PATH);
      }
    })
    .catch(() => {
      // Error checking local file, load from GitHub
      console.log('🌐 Loading PRODUCTION version from GitHub Pages');
      loadScript(GITHUB_PATH);
    });
  
  function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }
})();

