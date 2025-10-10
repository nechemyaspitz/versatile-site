# Collections Page Enter Animation - CSS Initial States

Add these CSS rules to your Webflow **Custom Code** (in the `<head>` section) to set the initial states and prevent FOUC.

## CSS to Add

```css
/* Collections Page Enter Animation - Initial States */

/* 1. Heading - characters will be masked and animated */
.font-color-primary {
  /* Optional: Add overflow hidden if you want strict masking */
  overflow: hidden;
}

/* 2. Filter button - hidden below view */
#filters-open {
  transform: translateY(100%);
}

/* 3. Optional: Add a wrapper for proper masking */
/* If the heading animation doesn't mask properly, wrap the heading in a div with: */
/* 
.char {
  display: inline-block;
}
*/
```

## Animation Summary

| Element | Start Time | Duration | Animation |
|---------|------------|----------|-----------|
| `.font-color-primary` (chars) | 0s | 1s | translateY 100%→0%, stagger 0.01s |
| `#filters-open` | 0.2s | 1s | translateY 100%→0% |

**Total animation duration:** ~1.2s

## Notes

- The heading uses SplitText with character masking for a smooth reveal effect
- Characters slide up from below the baseline
- Filter button animates in slightly after the heading for a staggered effect
- All animations use `expo.out` easing for a smooth deceleration

