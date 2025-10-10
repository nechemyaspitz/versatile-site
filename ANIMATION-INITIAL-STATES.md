# Animation Initial States - CSS Guide

This document contains all the CSS initial states needed to prevent FOUC (flash of unstyled content) before JavaScript animations load.

## 🏠 HOME PAGE

```css
/* 1. Hero heading - starts hidden and scaled down */
.hero-heading {
  opacity: 0;
  transform: scale(0.8);
  transform-origin: top left;
}

/* 2. Button group children - start below viewport */
.btn-group > * {
  transform: translateY(102%);
}

/* 3. Hero cover - starts full width (covers the hero) */
.hero-cover {
  width: 100%;
}

/* 4. Small premium text - starts hidden */
.sm-premium {
  opacity: 0;
}

/* 5. Swiper - starts slightly zoomed in */
.swiper {
  transform: scale(1.1);
}
```

---

## 📦 COLLECTIONS PAGE

```css
/* 1. Page heading - needs overflow masking for char animation */
.font-color-primary {
  overflow: hidden;
}

/* Optional: Create a wrapper for better masking control */
.font-color-primary .char {
  display: inline-block;
  transform: translateY(100%);
  will-change: transform;
}

/* 2. Filter button - starts below viewport */
#filters-open {
  transform: translateY(100%);
}

/* 3. Collection items - will be animated by JS, but set initial state */
.collection_grid-item {
  /* JS will handle initial opacity/position */
}
```

---

## 🛍️ PRODUCT PAGE

```css
/* 0. Hero cover - starts full width (covers everything) */
.hero-cover {
  width: 100%;
}

/* 1. Product title - starts hidden below */
#product-title {
  /* JS will split by chars and set initial state */
  /* opacity: 0; transform: translateY(20%); applied per char by JS */
}

/* 2. Product description - needs overflow masking for line animation */
.product-description {
  overflow: hidden;
}

/* 3. Variant buttons - start hidden below */
.variant-buttons {
  opacity: 0;
  transform: translateY(20%);
}

/* 4. Variant sizes - start hidden below */
.variant-sizes {
  opacity: 0;
  transform: translateY(20%);
}

/* 5. Variant finishes - start hidden below */
.variant-finishes {
  opacity: 0;
  transform: translateY(20%);
}

/* 6. Material spec - start hidden below */
#material {
  opacity: 0;
  transform: translateY(20%);
}

/* 7. Thickness spec - start hidden below */
#thickness {
  opacity: 0;
  transform: translateY(20%);
}

/* 8. Applications spec - start hidden below */
#applications {
  opacity: 0;
  transform: translateY(20%);
}
```

---

## 📝 NOTES

### SplitText Considerations:
- Elements animated with **SplitText** (like `.hero-heading`, `#product-title`, `.product-description`) have their styles applied dynamically by GSAP
- The CSS initial states are set on the parent element to prevent FOUC
- Once SplitText runs, it creates child elements (chars/lines) and applies transforms to those

### Transform Properties:
- Use `transform: translateY()` instead of `top/bottom` for better performance
- Use `transform: scale()` for smooth zoom effects
- Always include `transform-origin` when scaling to control the pivot point

### Overflow Masking:
- Elements with `overflow: hidden` create a "mask" for text sliding in/out
- This is essential for `.font-color-primary`, `.product-description`, and any char/line animations

### Will-Change:
- The `will-change: transform` property is added dynamically by JS for performance
- Avoid adding it to CSS globally as it can cause performance issues if overused

---

## 🎨 IMPLEMENTATION

Add these styles to your Webflow Custom Code (Head) or in a `<style>` tag:

```html
<!-- In Webflow: Project Settings > Custom Code > Head Code -->
<style>
  /* HOME PAGE */
  .hero-heading { opacity: 0; transform: scale(0.8); transform-origin: top left; }
  .btn-group > * { transform: translateY(102%); }
  .hero-cover { width: 100%; }
  .sm-premium { opacity: 0; }
  .swiper { transform: scale(1.1); }

  /* COLLECTIONS PAGE */
  .font-color-primary { overflow: hidden; }
  #filters-open { transform: translateY(100%); }

  /* PRODUCT PAGE */
  .hero-cover { width: 100%; }
  .product-description { overflow: hidden; }
  .variant-buttons { opacity: 0; transform: translateY(20%); }
  .variant-sizes { opacity: 0; transform: translateY(20%); }
  .variant-finishes { opacity: 0; transform: translateY(20%); }
  #material { opacity: 0; transform: translateY(20%); }
  #thickness { opacity: 0; transform: translateY(20%); }
  #applications { opacity: 0; transform: translateY(20%); }
</style>
```

---

## ⚠️ TROUBLESHOOTING

### Elements flash before animating:
- Ensure the CSS is loaded in the `<head>` (not at the end of `<body>`)
- Check that class names/IDs match exactly between CSS and HTML

### Elements don't animate:
- CSS initial states might be too specific - check selector specificity
- GSAP might not be clearing the CSS transforms - add `clearProps: 'all'` if needed

### Animations feel janky:
- Add `will-change: transform` to animated elements (via JS, not CSS)
- Ensure you're using `transform` properties, not `top/left/width` (except for `.hero-cover`)

---

## 🚀 VERSION

Current implementation: **v3.14.1**  
Last updated: 2025-10-10

