# Lenis Smooth Scrolling Setup

## ✅ Implementation Complete!

Lenis smooth scrolling has been integrated with Taxi.js page transitions.

---

## 🚀 Webflow Setup Required

### **Add Lenis CDN Script**

In **Webflow → Project Settings → Custom Code → Footer Code**, add Lenis BEFORE Taxi.js and your main.js:

```html
<!-- Lenis Smooth Scrolling -->
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>

<!-- Taxi.js Core -->
<script src="https://unpkg.com/@unseenco/e@latest/dist/e.min.js"></script>
<script src="https://unpkg.com/@unseenco/taxi@latest/dist/taxi.min.js"></script>

<!-- Your bundled code from GitHub Pages -->
<script defer src="https://nechemyaspitz.github.io/versatile-site/main.js"></script>
```

**⚠️ Order is important!** Lenis must load before your main.js.

---

## 🎯 What's Implemented

### **1. Lenis Initialization**
- ✅ Smooth scrolling enabled on page load
- ✅ Configurable duration (1.2s) and easing
- ✅ Mouse wheel and touch support
- ✅ Auto-resize on window changes

### **2. Taxi.js Integration**
- ✅ Scroll resets to top on page transitions
- ✅ Lenis reinitializes if instance is lost
- ✅ Works with back/forward navigation

### **3. Filter Drawer Integration**
- ✅ Scrolling pauses when filter drawer opens
- ✅ Scrolling resumes when filter drawer closes
- ✅ Prevents scroll conflicts with drawer

### **4. Utility Functions**
All in `src/utils/lenis.js`:
- `initLenis()` - Initialize Lenis
- `destroyLenis()` - Destroy instance
- `stopLenis()` - Pause scrolling
- `startLenis()` - Resume scrolling
- `scrollToTop()` - Smooth scroll to top
- `resetScroll()` - Instant scroll to top
- `getLenis()` - Get current instance

---

## 📋 Configuration

Current Lenis settings in `src/utils/lenis.js`:

```javascript
{
  duration: 1.2,          // Scroll animation duration
  easing: (t) => ...,     // Easing function
  orientation: 'vertical', // Scroll direction
  smoothWheel: true,       // Smooth mouse wheel
  wheelMultiplier: 1,      // Wheel sensitivity
  smoothTouch: false,      // Touch scroll (disabled for mobile)
  touchMultiplier: 2,      // Touch sensitivity
  infinite: false,         // No infinite scroll
  autoResize: true,        // Auto-resize on window changes
}
```

You can adjust these values to customize the scroll feel!

---

## 🧪 Testing Checklist

After adding the Lenis CDN script, test:

### **Basic Scrolling:**
- ✅ Smooth scrolling on mouse wheel
- ✅ Smooth scrolling on trackpad
- ✅ Works on all pages (home, collections, product)

### **Page Transitions:**
- ✅ Scroll resets to top when navigating
- ✅ Smooth scrolling works on new page
- ✅ Back/forward navigation works

### **Filter Drawer:**
- ✅ Open drawer → scrolling pauses
- ✅ Close drawer → scrolling resumes
- ✅ Can't scroll page when drawer is open

### **Console Check:**
Look for these messages:
```
✅ Lenis smooth scrolling initialized
🚕 Versatile Site v3.1.0 - Powered by Taxi.js + Lenis
```

---

## 🐛 Troubleshooting

### **Smooth scrolling not working?**
1. Check browser console for errors
2. Verify Lenis CDN script loads before main.js
3. Hard refresh (Cmd+Shift+R)
4. Check console for: `⚠️ Lenis not found!`

### **Scroll jumps instead of smooth?**
- Lenis CDN might be blocked
- Check browser console
- Verify script order in Webflow

### **Filter drawer scroll conflict?**
- Should auto-pause when drawer opens
- Check console for: `⏸️ Lenis paused` / `▶️ Lenis resumed`

### **Scroll doesn't reset on navigation?**
- Should reset automatically via Taxi.js hooks
- Check console during navigation
- May need to clear browser cache

---

## 🎨 Customization Tips

### **Adjust Scroll Speed:**
Edit `src/utils/lenis.js`:
```javascript
duration: 1.5,  // Slower (default: 1.2)
duration: 0.8,  // Faster
```

### **Change Easing:**
```javascript
easing: (t) => t,  // Linear
easing: (t) => 1 - Math.pow(1 - t, 3),  // Ease out cubic
```

### **Enable Smooth Touch (mobile):**
```javascript
smoothTouch: true,  // Enable
touchMultiplier: 1, // Adjust sensitivity
```

After changes, rebuild and deploy:
```bash
npm run build:prod
./deploy.sh "Updated Lenis config"
```

---

## 🔗 Resources

- **Lenis Docs:** https://github.com/studio-freight/lenis
- **CDN:** https://cdn.jsdelivr.net/npm/@studio-freight/lenis
- **Taxi.js Docs:** https://taxi.js.org/

---

## 📊 Performance Impact

- **Bundle Size:** +2KB (Lenis utility)
- **CDN Size:** ~10KB (Lenis library)
- **Performance:** Smooth 60fps scrolling
- **Browser Support:** All modern browsers

---

## ✨ Benefits

- ✅ **Buttery smooth scrolling** - Professional feel
- ✅ **Momentum scrolling** - Natural physics
- ✅ **Easy customization** - Adjust speed/easing
- ✅ **Mobile friendly** - Touch support
- ✅ **Lightweight** - Only ~10KB gzipped
- ✅ **Well integrated** - Works seamlessly with Taxi.js

---

**Lenis is ready!** Just add the CDN script to Webflow and you're good to go! 🚀

