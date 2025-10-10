# Home Page Exit Animation

The home page exit animation plays when navigating away from the home page. It's a coordinated reverse of the enter animation with adjusted timings.

## Animation Timeline

| Element | Start Time | Duration | Animation |
|---------|------------|----------|-----------|
| `.sm-premium` | 0s | 0.8s | chars opacity 1→0, stagger 0.01s |
| `.hero-heading` | 0s | 1s | opacity 1→0, scale 1→0.8 |
| `.btn-group > *` | 0.06s | 1s | translateY 0%→102%, stagger 0.05s |
| `.hero-cover` | 0.19s | 1s | width 0%→100% |
| `.swiper` | 0.19s | 1s | scale 1→0.5 |

**Total animation duration:** ~1.19s

## Implementation Details

The exit animation:
- Plays automatically when leaving the home page via Taxi.js navigation
- Is stored in the page state and can be killed if needed
- Returns a promise that resolves when complete
- Uses the same elements as the enter animation but reverses the motion

## Animation Breakdown

```
0.00s ━━━━━━━━━━━ .sm-premium (0.8s, chars stagger)
0.00s ━━━━━━━━━━━━━━━━━━━━ .hero-heading (1s)
0.06s   ━━━━━━━━━━━━━━━━━━ .btn-group > * (1s, stagger)
0.19s         ━━━━━━━━━━━━━━ .hero-cover (1s)
0.19s         ━━━━━━━━━━━━━━ .swiper (1s)
      └─────────────────────┘
              ~1.19s total
```

## Notes

- The exit animation is triggered by the `HomeRenderer.onLeave()` method
- All GSAP timelines are properly cleaned up in the destroy lifecycle
- The animation respects `prefers-reduced-motion` settings
- Element existence is checked before animating to prevent errors

