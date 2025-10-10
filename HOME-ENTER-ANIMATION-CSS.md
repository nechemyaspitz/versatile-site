# Home Page Enter Animation - CSS Initial States

Add these CSS rules to your Webflow **Custom Code** (in the `<head>` section) to set the initial states and prevent FOUC (Flash of Unstyled Content).

## CSS to Add

```css
/* Home Page Enter Animation - Initial States */

/* 1. Hero heading - hidden, scaled down */
.hero-heading {
  opacity: 0;
  transform: scale(0.8);
  transform-origin: top left;
}

/* 2. Button group children - pushed down out of view */
.btn-group > * {
  transform: translateY(102%);
}

/* 3. Hero cover - full width (will animate to 0%) */
.hero-cover {
  width: 100%;
}

/* 4. Small premium text - parent stays visible, chars will be animated */
/* DO NOT set opacity on .sm-premium as GSAP will handle char opacity */

/* 5. Swiper - scaled up (will animate to 1) */
.swiper {
  transform: scale(1.1);
}

/* Required: Button group must have overflow hidden to clip children */
.btn-group {
  overflow: hidden;
}
```

## Notes

- These styles set the **initial state** before JavaScript loads
- The JavaScript animation will automatically transition from these states to the final states
- Make sure to add this CSS in the **`<head>`** section of your Webflow project (Project Settings > Custom Code > Head Code)
- If you see a flash of content, ensure this CSS is loaded before the page content renders

## Animation Timeline Summary

| Element | Start Time | Duration | Animation |
|---------|------------|----------|-----------|
| `.hero-heading` | 0s | 1s | opacity 0→1, scale 0.8→1 |
| `.btn-group > *` | 0.1s | 1s | translateY 102%→0%, stagger 0.05s |
| `.hero-cover` | 0.34s | 1s | width 100%→0% |
| `.sm-premium` | 0.47s | 1.27s | chars opacity 0→1, stagger 0.02s |
| `.swiper` | 0.5s | 1.25s | scale 1.1→1 |

**Total animation duration:** ~1.75s

