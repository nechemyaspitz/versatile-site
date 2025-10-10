# Product Page Enter Animation - CSS Initial States

Add these CSS rules to your Webflow **Custom Code** (in the `<head>` section) to set the initial states for the product page animations.

## CSS to Add

```css
/* Product Page Enter Animation - Initial States */

/* 1. Product title - chars will be split and animated */
#product-title {
  /* Initial state will be set by GSAP */
}

/* 2. Product description - lines will be masked */
.product-description {
  overflow: hidden;
}

/* Optional: Line masking */
.line-mask {
  overflow: hidden;
  display: block;
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
| `#product-title` | 0s | 1s | opacity 0 + y 20% → 100% + y 0% | expo.out | SplitText chars, stagger 0.2s total |
| `.product-description` | 0.15s | 1s | y 100% → 0% | expo.out | SplitText lines with mask, stagger 0.1s total |
| `.variant-buttons` | 0.33s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `.variant-sizes` | 0.4s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `.variant-finishes` | 0.5s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `#material` | 0.58s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `#thickness` | 0.66s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |
| `#applications` | 0.74s | 0.8s | opacity 0 + y 20% → 100% + y 0% | expo.out | |

**Total duration:** ~1.5s

### **Exit Animation Timeline:**

| Element | Start | Duration | Animation | Easing | Notes |
|---------|-------|----------|-----------|--------|-------|
| `#product-title` | 0s | 0.5s | opacity 100% + y 0% → 0% + y -20% | power2.in | Chars exit up, stagger 0.08s total |
| `.product-description` | 0.05s | 0.5s | y 0% → -100% | power2.in | Lines exit up, stagger 0.04s total |
| `#applications` | 0s | 0.5s | opacity 100% + y 0% → 0% + y 20% | power2.in | Reverse order |
| `#thickness` | 0.04s | 0.5s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `#material` | 0.08s | 0.5s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `.variant-finishes` | 0.12s | 0.5s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `.variant-sizes` | 0.16s | 0.5s | opacity 100% + y 0% → 0% + y 20% | power2.in | |
| `.variant-buttons` | 0.2s | 0.5s | opacity 100% + y 0% → 0% + y 20% | power2.in | |

**Total duration:** ~0.7s

---

## Notes

- Exit animation is faster (0.5s vs 1s duration)
- Exit timing is tighter (0.04s vs 0.08s gaps)
- Exit animation reverses the order for elements
- Title and description use character/line splitting for elegant reveals

