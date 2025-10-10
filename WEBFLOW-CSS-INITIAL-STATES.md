# Webflow Custom Code - Animation Initial States

## 📋 COPY & PASTE THIS INTO WEBFLOW

**Location:** Project Settings → Custom Code → Head Code

```html
<style>
/* ============================================
   ANIMATION INITIAL STATES - v3.14.1
   Prevents flash of unstyled content (FOUC)
   ============================================ */

/* HOME PAGE ANIMATIONS */
.hero-heading {
  opacity: 0;
  transform: scale(0.8);
  transform-origin: top left;
}

.btn-group > * {
  /* Removed - GSAP handles this to avoid conflicts */
  /* transform: translateY(102%); */
}

.hero-cover {
  width: 100%;
}

.sm-premium {
  opacity: 0;
}

.swiper {
  transform: scale(1.1);
}

/* COLLECTIONS PAGE ANIMATIONS */
.font-color-primary {
  overflow: hidden;
}

#filters-open {
  /* Removed - GSAP handles this to avoid conflicts */
  /* transform: translateY(100%); */
}

/* PRODUCT PAGE ANIMATIONS */
.product-description {
  overflow: hidden;
}

.variant-buttons,
.variant-sizes,
.variant-finishes,
#material,
#thickness,
#applications {
  opacity: 0;
  transform: translateY(20%);
}
</style>
```

---

## ✅ VERIFICATION CHECKLIST

After adding the CSS to Webflow:

- [ ] Publish the site
- [ ] Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)
- [ ] Test each page:
  - [ ] Home page: Hero heading, buttons, cover, premium text, swiper all animate in
  - [ ] Collections page: Heading chars and filter button slide up
  - [ ] Product page: Title, description, variants, specs all animate in
- [ ] Check that there's no FOUC (flash before animation)
- [ ] Verify animations work on first load AND when navigating via Taxi.js

---

## 📝 MINIFIED VERSION (OPTIONAL)

If you prefer a minified version to save bytes:

```html
<style>.hero-heading{opacity:0;transform:scale(.8);transform-origin:top left}.btn-group>*{transform:translateY(102%)}.hero-cover{width:100%}.sm-premium{opacity:0}.swiper{transform:scale(1.1)}.font-color-primary{overflow:hidden}#filters-open{transform:translateY(100%)}.product-description{overflow:hidden}.variant-buttons,.variant-sizes,.variant-finishes,#material,#thickness,#applications{opacity:0;transform:translateY(20%)}</style>
```

---

## 🔧 ADVANCED: Per-Page Optimization (OPTIONAL)

If you want to reduce CSS on pages that don't need certain styles, you can add page-specific CSS in Webflow's **Page Settings → Custom Code → Head Code** for each page:

### Home Page Only:
```html
<style>
.hero-heading { opacity: 0; transform: scale(0.8); transform-origin: top left; }
.btn-group > * { transform: translateY(102%); }
.hero-cover { width: 100%; }
.sm-premium { opacity: 0; }
.swiper { transform: scale(1.1); }
</style>
```

### Collections Page Only:
```html
<style>
.font-color-primary { overflow: hidden; }
#filters-open { transform: translateY(100%); }
</style>
```

### Product Page Only:
```html
<style>
.hero-cover { width: 100%; }
.product-description { overflow: hidden; }
.variant-buttons,
.variant-sizes,
.variant-finishes,
#material,
#thickness,
#applications {
  opacity: 0;
  transform: translateY(20%);
}
</style>
```

**Note:** The global approach (all styles in Project Settings) is simpler and recommended unless you're optimizing for very slow connections.

