# Debug Lenis Jitter Issue

## What to Check in Browser Console

After deploying, open the collections page and watch the console for:

### 1. **Lenis Resize Frequency**
Look for `📐 Lenis resize` messages:
- Should see them as images load
- Should NOT see them constantly during scroll
- If you see hundreds during scroll = problem!

### 2. **Container Height Changes**
Look for `📏 Container height` messages:
- Should be stable after images load
- If height keeps changing during scroll = layout thrashing!

### 3. **Image Loading**
Look for `🖼️ Tracking X images`:
- Should match expected number
- All should complete loading

## Browser DevTools Checks

### Performance Tab
1. Start recording
2. Scroll on collections page for 3 seconds
3. Stop recording
4. Look for:
   - **Layout thrashing** (purple bars)
   - **Paint/Composite** (green bars)
   - **JavaScript execution** during scroll

### Rendering Tab
Enable:
- **Paint flashing** - Shows what repaints during scroll
- **Layer borders** - Shows compositing layers
- **FPS meter** - Shows if FPS drops below 60

## Possible Culprits

If jitter persists even with cached items:

1. **CSS Issues**
   - Transforms on scroll
   - Transitions interfering
   - Will-change not set properly

2. **DOM Complexity**
   - Too many elements causing layout calculation slowdown
   - Consider virtual scrolling if 100+ products

3. **Event Listeners**
   - Hover effects triggering during scroll
   - Non-passive listeners blocking scroll

4. **Lenis Configuration**
   - Wrong easing/lerp values
   - Smooth scroll algorithm struggling with DOM

## Quick Test

Try disabling Lenis temporarily:
```javascript
// In browser console
window.lenis.destroy();
```

If scroll is smooth WITHOUT Lenis → Lenis config issue
If scroll is STILL jittery → DOM/CSS issue

