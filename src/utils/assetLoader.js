// Asset loader with deduplication
const loadedAssets = new Set();

export const loadScript = (src, attrs = {}) => {
  if (loadedAssets.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload = () => {
      loadedAssets.add(src);
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
};

export const loadStyle = (href) => {
  if (loadedAssets.has(href)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = () => {
      loadedAssets.add(href);
      resolve();
    };
    l.onerror = reject;
    document.head.appendChild(l);
  });
};

