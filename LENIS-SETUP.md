# Lenis Smooth Scroll Setup Guide

## ✅ Your Current Setup

You have the basics working:
```javascript
const lenis = new Lenis({
  autoRaf: true,
});
```

This is a good start! `autoRaf: true` means Lenis handles its own animation loop.

---

## 🎯 Recommended Configuration

Here's an optimized setup with customizable smoothness:

### **Basic (Your Current Setup):**
```javascript
const lenis = new Lenis({
  autoRaf: true,
});
```

### **Customized (Recommended):**
```javascript
const lenis = new Lenis({
  // Core settings
  duration: 1.2,              // Animation duration (higher = slower/smoother)
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing function
  
  // Smoothness settings
  lerp: 0.1,                  // Linear interpolation amount (0.1 = smooth, 1 = instant)
  smoothWheel: true,          // Smooth scroll on mouse wheel
  smoothTouch: false,         // Smooth scroll on touch (can cause issues on mobile)
  
  // Wheel settings
  wheelMultiplier: 1,         // Scroll speed multiplier (higher = faster)
  touchMultiplier: 2,         // Touch scroll speed
  
  // Performance
  infinite: false,            // Infinite scroll (usually false)
  autoRaf: true,              // Let Lenis handle RAF
});
```

---

## ⚙️ Customization Guide

### **1. Smoothness Strength** (Main Control)

**`lerp` (0.01 - 1)**
- `0.01` = Very smooth, long deceleration (may feel sluggish)
- `0.1` = Smooth, natural feel ✅ **RECOMMENDED**
- `0.2` = Moderate smoothness
- `0.5` = Less smooth, more responsive
- `1` = Instant, no smoothing (native scroll)

**Example:**
```javascript
lerp: 0.1,  // Sweet spot for most sites
```

---

### **2. Animation Duration**

**`duration` (seconds)**
- `0.8` = Quick, snappy
- `1.2` = Smooth, natural ✅ **RECOMMENDED**
- `1.5` = Slower, more dramatic
- `2.0` = Very slow, cinematic

**Example:**
```javascript
duration: 1.2,  // Good balance
```

---

### **3. Scroll Speed**

**`wheelMultiplier` (0.1 - 5)**
- `0.5` = Slow scrolling
- `1` = Normal speed ✅ **DEFAULT**
- `1.5` = Faster scrolling
- `2` = Very fast

**Example:**
```javascript
wheelMultiplier: 1,  // Normal speed
```

---

### **4. Easing Function**

**Pre-made options:**

**Smooth & Natural (Default):**
```javascript
easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
```

**Ease Out (Deceleration):**
```javascript
easing: (t) => 1 - Math.pow(1 - t, 3),
```

**Ease In Out (S-curve):**
```javascript
easing: (t) => t < 0.5 
  ? 4 * t * t * t 
  : 1 - Math.pow(-2 * t + 2, 3) / 2,
```

**Linear (No easing):**
```javascript
easing: (t) => t,
```

---

## 🎨 Recommended Presets

### **Preset 1: Subtle & Professional** ✅
```javascript
const lenis = new Lenis({
  duration: 1.2,
  lerp: 0.1,
  smoothWheel: true,
  wheelMultiplier: 1,
  autoRaf: true,
});
```
*Best for: Business sites, portfolios, e-commerce*

---

### **Preset 2: Smooth & Luxurious**
```javascript
const lenis = new Lenis({
  duration: 1.5,
  lerp: 0.08,
  smoothWheel: true,
  wheelMultiplier: 0.8,
  autoRaf: true,
});
```
*Best for: High-end brands, luxury products*

---

### **Preset 3: Snappy & Responsive**
```javascript
const lenis = new Lenis({
  duration: 0.8,
  lerp: 0.15,
  smoothWheel: true,
  wheelMultiplier: 1.2,
  autoRaf: true,
});
```
*Best for: Modern apps, fast-paced sites*

---

## 🔧 Integration with Taxi.js (SPA)

**Important:** For SPAs, you need to handle Lenis across page transitions.

### **Add to your Taxi.js setup:**

**Option A: Keep Lenis running (Recommended)**
```javascript
// In your Webflow global script or main.js
let lenis;

document.addEventListener('DOMContentLoaded', () => {
  lenis = new Lenis({
    duration: 1.2,
    lerp: 0.1,
    smoothWheel: true,
    wheelMultiplier: 1,
    autoRaf: true,
  });
  
  // Expose globally
  window.lenis = lenis;
});
```

**Then in your Taxi navigation:**
```javascript
taxiInstance.on('NAVIGATE_END', () => {
  // Scroll to top with Lenis smooth scroll
  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: false });
  }
});
```

---

**Option B: Stop/Start on navigation**
```javascript
taxiInstance.on('NAVIGATE_OUT', () => {
  // Stop Lenis during transition
  if (window.lenis) {
    window.lenis.stop();
  }
});

taxiInstance.on('NAVIGATE_END', () => {
  // Restart Lenis and scroll to top
  if (window.lenis) {
    window.lenis.start();
    window.lenis.scrollTo(0, { immediate: true }); // Instant scroll to top
  }
});
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: Lenis conflicts with native scroll**
**Fix:** Make sure you're not setting `overflow: hidden` on body/html

### **Issue 2: Scroll feels too slow on mobile**
**Fix:** Set `smoothTouch: false` (mobile users expect native scroll)

### **Issue 3: Anchor links don't work**
**Fix:** Use Lenis's scrollTo method:
```javascript
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target && window.lenis) {
      window.lenis.scrollTo(target, { offset: 0 });
    }
  });
});
```

### **Issue 4: Back button scroll position not restored**
**Fix:** Already handled! Our `window.scrollTo(0, 0)` works with Lenis

---

## 📊 Performance Considerations

### **Good:**
- ✅ Lenis is lightweight (~3KB gzipped)
- ✅ Uses `requestAnimationFrame` efficiently
- ✅ No jQuery dependency
- ✅ Works well with Taxi.js

### **Watch out for:**
- ⚠️ Don't use multiple scroll libraries at once
- ⚠️ Disable on mobile if performance is an issue (`smoothTouch: false`)
- ⚠️ Very low `lerp` values (<0.05) can feel laggy

---

## 🎯 Quick Start (Copy-Paste)

**Add this to your Webflow global script:**

```javascript
// Lenis Smooth Scroll
const lenis = new Lenis({
  duration: 1.2,        // Adjust smoothness (0.8 - 2.0)
  lerp: 0.1,            // Adjust responsiveness (0.05 - 0.2)
  smoothWheel: true,
  smoothTouch: false,   // Better for mobile
  wheelMultiplier: 1,
  autoRaf: true,
});

// Expose globally for Taxi.js integration
window.lenis = lenis;

// Optional: Update scroll on window resize
window.addEventListener('resize', () => {
  lenis.resize();
});
```

**Then update your Taxi transition (if needed):**
```javascript
// In src/transitions/DefaultTransition.js
onEnter({ to, done }) {
  // Use Lenis for smooth scroll to top
  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo(0, 0);
  }
  
  // Rest of your fade-in code...
}
```

---

## 🎨 Recommended Settings for Your Site

Based on your e-commerce site, I recommend:

```javascript
const lenis = new Lenis({
  duration: 1.2,         // Smooth but not too slow
  lerp: 0.1,             // Natural feel
  smoothWheel: true,
  smoothTouch: false,    // Native scroll on mobile
  wheelMultiplier: 1,    // Standard speed
  autoRaf: true,
});

window.lenis = lenis;
```

**Why these settings:**
- ✅ Professional feel without being distracting
- ✅ Good for product browsing
- ✅ Won't frustrate users trying to scroll quickly
- ✅ Works well with your existing Taxi.js setup

---

## 🔄 Testing Different Strengths

Try these in your console while on the site:

```javascript
// Make it smoother
window.lenis.options.lerp = 0.05;
window.lenis.options.duration = 1.5;

// Make it snappier
window.lenis.options.lerp = 0.15;
window.lenis.options.duration = 0.8;

// Make scrolling faster
window.lenis.options.wheelMultiplier = 1.5;

// Make scrolling slower
window.lenis.options.wheelMultiplier = 0.7;
```

Find what feels best, then update your global script!

---

**Current Status:** ✅ Lenis is working with `autoRaf: true`  
**Next Step:** Customize `lerp` and `duration` to your taste!

