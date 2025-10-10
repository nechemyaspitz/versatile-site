# Product Page Enter Animation - CSS Initial States

Add these CSS rules to your Webflow **Custom Code** (in the `<head>` section) to set the initial states for the product page animations.

## CSS to Add

```css
/* Product Page Enter Animation - Initial States */

/* 0. Hero cover - starts full width */
.hero-cover {
  width: 100%;
}

/* 1. Product title - chars will be split and animated */
#product-title {
  /* Initial state will be set by GSAP */
}

/* 2. Product description - lines will be masked */
.product-description {
  overflow: hidden;
}

/* 3. Variant buttons - hidden below */
.variant-buttons {
  opacity: 0;
  transform: translateY(20%);
}

/* 4. Variant sizes - hidden below */
.variant-sizes {
  opacity: 0;
  transform: translateY(20%);
}

/* 5. Variant finishes - hidden below */
.variant-finishes {
  opacity: 0;
  transform: translateY(20%);
}

/* 6. Material spec - hidden below */
#material {
  opacity: 0;
  transform: translateY(20%);
}

/* 7. Thickness spec - hidden below */
#thickness {
  opacity: 0;
  transform: translateY(20%);
}

/* 8. Applications spec - hidden below */
#applications {
  opacity: 0;
  transform: translateY(20%);
}
```

## Animation Summary

### **Enter Animation Timeline:**

| Element | Start | Duration | Animation | Easing | Notes |
|---------|-------|----------|-----------|--------|-------|
| `.hero-cover` | 0s | 1s | width 100% → 0% | expo.inOut | Reveals page |
| `#product-title` | 0.2s | 1s | opacity 0 + y 20% → 100% + y 0% | expo.out | SplitText chars, stagger 0.2s total |
| `.product-description` | 0.35s | 1s | y 100% → 0% | expo.out | SplitText lines with mask, stagger 0.1s total |
| `.variant-buttons` | 0.53s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `.variant-sizes` | 0.6s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `.variant-finishes` | 0.7s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `#material` | 0.78s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `#thickness` | 0.86s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `#applications` | 0.94s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |

**Total duration:** ~1.7s

### **Exit Animation Timeline:**

| Element | Start | Duration | Animation | Easing | Notes |
|---------|-------|----------|-----------|--------|-------|
| `#applications` | 0s | 0.4s | opacity 100% + y 0% → 0% + y 20% | power2.in | Reverse order, exit DOWN |
| `#thickness` | 0.03s | 0.4s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `#material` | 0.06s | 0.4s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `.variant-finishes` | 0.09s | 0.4s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `.variant-sizes` | 0.12s | 0.4s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `.variant-buttons` | 0.15s | 0.4s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `.product-description` | 0.18s | 0.4s | y 0% → 100% | power2.in | Lines exit DOWN with mask, stagger 0.03s total |
| `#product-title` | 0.21s | 0.4s | opacity 100% + y 0% → 0% + y 20% | power2.in | Chars exit DOWN, stagger 0.06s total |
| `.hero-cover` | 0.24s | 0.5s | width 0% → 100% | expo.inOut | Covers page |

**Total duration:** ~0.75s

---

## Notes

- Exit animation is faster (0.5s vs 1s duration)
- Exit timing is tighter (0.04s vs 0.08s gaps)
- Exit animation reverses the order for elements
- Title and description use character/line splitting for elegant reveals

