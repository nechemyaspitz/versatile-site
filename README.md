# Versatile Site - Modular Barba.js SPA

This project is a modern, modular single-page application (SPA) built with Barba.js, featuring performance optimizations and clean architecture.

## 📁 Project Structure

```
versatile-site/
├── src/
│   ├── main.js                  # Entry point
│   ├── core/
│   │   ├── barbaManager.js      # Barba initialization & routing
│   │   └── state.js             # State management & caching
│   ├── pages/
│   │   ├── home.js              # Home page (Swiper slider)
│   │   ├── collections.js       # Collections page (product filter)
│   │   └── product.js           # Product page (carousel)
│   ├── components/
│   │   ├── navigation.js        # Persistent navigation
│   │   ├── filterDrawer.js      # Filter drawer (GSAP)
│   │   └── buttonStagger.js     # Button character stagger
│   └── utils/
│       ├── assetLoader.js       # Dynamic script/style loading
│       └── webflow.js           # Webflow interactions
├── main.js                      # Bundled output (generated)
├── package.json
├── rollup.config.js
└── README.md
```

## 🚀 Performance Optimizations

### 1. **Prefetching**
- Supports `@barba/prefetch` plugin for hover/viewport-based prefetching
- Add to Webflow before your main script:
  ```html
  <script src="https://unpkg.com/@barba/prefetch"></script>
  ```

### 2. **Smart Scroll Restoration**
- Restores scroll position on back/forward navigation
- Scrolls to top on normal clicks
- Uses `history.scrollRestoration = 'manual'`

### 3. **Collections Page Caching**
- **Response Caching**: API responses cached in memory (Map)
- **DOM Snapshots**: Product grid saved before leaving, restored on back
- Eliminates refetch delay when using browser back button

### 4. **Asset Deduplication**
- Scripts and styles loaded only once per session
- Shared assets reused across page transitions

## 🛠 Build & Development

### Installation
```bash
npm install
```

### Development (watch mode)
```bash
npm run dev
```

### Production Build
```bash
npm run build:prod
```

This generates a minified `main.js` file in the project root.

## 📦 Webflow Integration

### 1. Add Barba Core (Site Settings → Footer Code)
```html
<script src="https://unpkg.com/@barba/core"></script>
<!-- Optional: Enable prefetch -->
<script src="https://unpkg.com/@barba/prefetch"></script>
```

### 2. Upload Built File
- Build the project: `npm run build:prod`
- Upload `main.js` to Webflow Assets
- Add to Footer Code (after Barba):
```html
<script defer src="https://uploads-ssl.webflow.com/YOUR-SITE-ID/js/main.js"></script>
```

### 3. Page Setup
Each page needs a `data-barba-namespace` attribute:
```html
<div data-barba="wrapper">
  <div data-barba="container" data-barba-namespace="home">
    <!-- Home page content -->
  </div>
</div>
```

Supported namespaces:
- `home` - Hero slider with GSAP SplitText
- `collections` - Infinite scroll product filter
- `product` - Fancyapps carousel & lightbox

## 🎯 Key Features

### Home Page
- Swiper.js carousel with custom GSAP animations
- SplitText character animations
- Parallax image effects
- Autoplay with pause on hover

### Collections Page
- Infinite scroll product grid
- Real-time filtering (color, size, finish, material, application)
- Nice Select dropdowns
- Image hover previews
- URL param sync
- Back button cache (instant restore)

### Product Page
- Fancyapps Carousel with thumbnails
- Lightbox gallery (Fancybox)
- Variant switching with URL params
- Dynamic variant info display

### Navigation
- Persistent across page transitions
- Hamburger menu with scaling animation
- Active link highlighting
- ESC key support

## 🔄 How Caching Works

### Collections Back/Forward Cache

When you leave the Collections page, we save:
- Product grid HTML
- Filter state (active filters, sort, page)
- Scroll position

When you return via back/forward:
1. Check if snapshot exists for current URL
2. If yes: restore DOM instantly, skip API call
3. If no: fetch fresh data from API

### API Response Cache

All Supabase requests are cached by URL:
- First request: fetches from API
- Subsequent requests: returns from cache instantly
- Survives page transitions within the SPA session
- Cleared on page refresh

## 🐛 Troubleshooting

### Module not found errors
Make sure to run `npm install` and build the project.

### Barba not initializing
Check that `@barba/core` is loaded before your main script in Webflow.

### Scroll not restoring
Ensure `history.scrollRestoration = 'manual'` is set (handled automatically).

### Prefetch not working
Add the `@barba/prefetch` script tag and verify it loads before main.js.

## 📝 Development Notes

- All external dependencies (GSAP, Swiper, etc.) are loaded dynamically
- Each page module is self-contained with its own init/destroy lifecycle
- State management is centralized in `core/state.js`
- Navigation remains persistent outside Barba transitions

## 🔗 External Dependencies (CDN)

These are loaded dynamically as needed:
- **Barba.js** - Core & Prefetch
- **GSAP** - Animations & SplitText
- **Swiper** - Home slider
- **Nice Select 2** - Styled dropdowns
- **Fancyapps UI** - Carousel & Fancybox

No npm packages needed in production; everything bundles from `src/`.

