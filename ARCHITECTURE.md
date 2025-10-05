# Architecture Documentation

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Webflow Site                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │    Home     │  │ Collections │  │   Product   │  │   │
│  │  │   Page      │  │    Page     │  │    Page     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                       │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         Persistent Navigation                  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Barba.js (SPA Router)                   │   │
│  │  • Intercepts navigation                             │   │
│  │  • Manages transitions                               │   │
│  │  • Handles lifecycle                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               barbaManager.js                        │   │
│  │  • Route configuration                               │   │
│  │  • Scroll restoration                                │   │
│  │  • Performance hooks                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│              │              │              │                 │
│              ▼              ▼              ▼                 │
│     ┌───────────┐  ┌─────────────┐  ┌──────────┐          │
│     │  Home     │  │ Collections │  │ Product  │          │
│     │  Module   │  │   Module    │  │  Module  │          │
│     └───────────┘  └─────────────┘  └──────────┘          │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            State Management (state.js)               │   │
│  │  • PageState Map                                     │   │
│  │  • pageSnapshots Map (Collections cache)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
            ┌─────────────────────────────┐
            │      External APIs          │
            │  • Supabase (Products)      │
            │  • CDN (Assets)             │
            └─────────────────────────────┘
```

## 📦 Module Dependency Graph

```
main.js
  └─> barbaManager.js
        ├─> pages/
        │     ├─> home.js
        │     │     ├─> assetLoader.js
        │     │     └─> state.js
        │     │
        │     ├─> collections.js
        │     │     ├─> assetLoader.js
        │     │     ├─> state.js
        │     │     └─> filterDrawer.js
        │     │
        │     └─> product.js
        │           ├─> assetLoader.js
        │           └─> state.js
        │
        ├─> components/
        │     ├─> navigation.js
        │     ├─> filterDrawer.js
        │     └─> buttonStagger.js
        │
        ├─> utils/
        │     ├─> assetLoader.js
        │     └─> webflow.js
        │
        └─> state.js
```

## 🔄 Page Lifecycle

### Standard Page Transition

```
User clicks link
       │
       ▼
┌──────────────┐
│ barba.hooks  │
│   .before    │ ────> closeNav()
└──────────────┘
       │
       ▼
┌──────────────┐
│    View      │
│ beforeLeave  │ ────> destroy old page
└──────────────┘        • Cancel event listeners
       │                • Clean up resources
       ▼                • Save state (if Collections)
┌──────────────┐
│  Transition  │
│    .leave    │ ────> Fade out old container
└──────────────┘
       │
       ▼
  Fetch new HTML
       │
       ▼
┌──────────────┐
│  Transition  │
│    .enter    │ ────> Fade in new container
└──────────────┘
       │
       ▼
┌──────────────┐
│    View      │
│  afterEnter  │ ────> Initialize new page
└──────────────┘        • Load page assets
       │                • Bind event listeners
       ▼                • Restore state (if back)
┌──────────────┐
│ barba.hooks  │
│    .after    │ ────> Restore scroll position
└──────────────┘        (if back/forward)
       │
       ▼
┌──────────────┐
│ barba.hooks  │
│  .afterEnter │ ────> Update nav, reinit Webflow
└──────────────┘
       │
       ▼
    Page ready
```

## 🎯 Collections Caching Strategy

### Layer 1: API Response Cache

```javascript
// In InfiniteScrollProductFilter class
this._respCache = new Map();

// Request flow:
User applies filter
       │
       ▼
  Build URL (params hash)
       │
       ▼
  Check _respCache.has(url)
       │
       ├─> YES ──> Return cached data (instant)
       │
       └─> NO ──┐
                │
                ▼
         Fetch from API
                │
                ▼
      Store in _respCache
                │
                ▼
         Render items
```

### Layer 2: DOM Snapshots

```javascript
// Before leaving Collections
User navigates away
       │
       ▼
saveCollectionsSnapshot()
       │
       ├─> Save grid.innerHTML
       ├─> Save filter state
       └─> Save scroll position
              │
              ▼
      Store in pageSnapshots Map
            (key: URL)


// When returning via back
User hits back button
       │
       ▼
restoreCollectionsSnapshotIfPossible()
       │
       ▼
  Check pageSnapshots.has(url)
       │
       ├─> YES ──┐
       │         │
       │         ▼
       │   Restore grid HTML
       │         │
       │         ▼
       │   Re-bind event listeners
       │         │
       │         ▼
       │   Restore scroll
       │         │
       │         └──> Done (instant, no fetch!)
       │
       └─> NO ──> Fetch fresh data
```

## 🎨 Component Interaction

### Collections Page

```
┌─────────────────────────────────────────────────┐
│          Collections Page Container             │
│                                                  │
│  ┌───────────────┐      ┌──────────────────┐   │
│  │ Filter Drawer │      │  Product Grid    │   │
│  │               │      │                  │   │
│  │  ┌─────────┐ │      │ ┌──────────────┐ │   │
│  │  │Checkbox │ │      │ │ Product Item │ │   │
│  │  │Groups   │ │      │ │              │ │   │
│  │  └─────────┘ │      │ │ ┌──────────┐ │ │   │
│  │               │      │ │ │  Image   │ │ │   │
│  │  ┌─────────┐ │      │ │ │  Hover   │ │ │   │
│  │  │  Sort   │ │      │ │ └──────────┘ │ │   │
│  │  │Dropdown │ │      │ │              │ │   │
│  │  └─────────┘ │      │ │ ┌──────────┐ │ │   │
│  │               │      │ │ │ Variants │ │ │   │
│  │  ┌─────────┐ │      │ │ └──────────┘ │ │   │
│  │  │  Clear  │ │      │ └──────────────┘ │   │
│  │  │ Button  │ │      │                  │   │
│  │  └─────────┘ │      │ [More items...]  │   │
│  └───────────────┘      └──────────────────┘   │
│         │                       │               │
│         └───────────┬───────────┘               │
│                     │                           │
│                     ▼                           │
│  ┌──────────────────────────────────────────┐  │
│  │  InfiniteScrollProductFilter (Singleton) │  │
│  │  • Manages state                         │  │
│  │  • Handles API calls                     │  │
│  │  • Updates UI                            │  │
│  │  • Caches responses                      │  │
│  └──────────────────────────────────────────┘  │
│                     │                           │
│                     ▼                           │
│        ┌─────────────────────────┐              │
│        │  Intersection Observer  │              │
│        │  (Infinite Scroll)      │              │
│        └─────────────────────────┘              │
└─────────────────────────────────────────────────┘
```

## 🔐 State Management

```javascript
// Global state containers
PageState = Map {
  'home' => { destroy: Function },
  'collections' => { destroy: Function },
  'product' => { destroy: Function }
}

pageSnapshots = Map {
  'https://site.com/collections' => {
    html: '<div>...</div>',
    state: {
      activeFilters: { colors: ['blue'] },
      currentSort: 'recommended',
      currentPage: 1,
      hasMorePages: true,
      totalItems: 42
    },
    scrollY: 1250
  }
}

// Instance state
window.productFilter = InfiniteScrollProductFilter {
  _respCache: Map {
    'https://api.com/filter?color=blue' => {
      items: [...],
      pagination: {...}
    }
  }
}
```

## 🚀 Performance Optimizations

### 1. Prefetch Strategy

```
User hovers over link
       │
       ▼
@barba/prefetch detects hover
       │
       ▼
Fetch HTML in background
       │
       ▼
Store in Barba cache
       │
       ▼
User clicks (later)
       │
       ▼
Use cached HTML (instant!)
```

### 2. Scroll Restoration

```javascript
// Automatic by Barba
history.scrollRestoration = 'manual';

barba.hooks.after((ctx) => {
  if (ctx.trigger === 'back' || ctx.trigger === 'forward') {
    // Restore
    window.scrollTo(0, barba.history.current?.scroll?.y ?? 0);
  } else {
    // Reset
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
});
```

### 3. Asset Loading

```javascript
// Deduplicated loading
loadedAssets = Set(['swiper.js', 'gsap.js', ...])

loadScript('swiper.js')
  ├─> Check Set
  │     ├─> Has it? Return resolved Promise
  │     └─> Don't have it? Load and add to Set
  └─> Subsequent calls return instantly
```

## 🧩 Extension Points

### Add a New Page Type

1. Create `src/pages/newpage.js`:
```javascript
import { loadScript } from '../utils/assetLoader.js';
import { setState } from '../core/state.js';

export async function initNewPage() {
  // Load dependencies
  // Initialize page
  
  setState('newpage', {
    destroy: () => {
      // Cleanup
    }
  });
}
```

2. Register in `barbaManager.js`:
```javascript
{
  namespace: 'newpage',
  beforeLeave() {
    getState('newpage')?.destroy?.();
    clearState('newpage');
  },
  async afterEnter() {
    await initNewPage();
  }
}
```

### Add a New Component

1. Create `src/components/newcomponent.js`:
```javascript
export function initNewComponent() {
  // Component logic
}
```

2. Import where needed:
```javascript
import { initNewComponent } from '../components/newcomponent.js';
```

## 📊 Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Collections back | ~500ms | ~0ms | ∞ |
| Code organization | 1 file | 12 files | ✓ |
| Bundle size | Same | Same | = |
| Maintainability | Low | High | ✓ |
| Scroll restoration | None | Full | ✓ |
| Prefetch | None | Full | ✓ |

---

**Architecture designed for:**
- 🎯 Maintainability
- ⚡ Performance
- 🔧 Extensibility
- 📦 Modularity

