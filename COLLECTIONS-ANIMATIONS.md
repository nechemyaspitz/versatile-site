# Collections Page Animations

Complete documentation for all animations on the collections page.

## 📋 **CSS Initial States Required**

Add this CSS to Webflow **Head Code**:

```css
/* Collections Page Animations - Initial States */

/* Heading masking for character animation */
.font-color-primary {
  overflow: hidden;
}

/* Filter button initial state */
#filters-open {
  transform: translateY(100%);
}

/* Skeleton loader pulse animation */
@keyframes skeleton-pulse {
  0%, 100% {
    background-position: 200% 0;
  }
  50% {
    background-position: -200% 0;
  }
}

/* Optional: Better char display for masking */
.char {
  display: inline-block;
}
```

---

## 🎬 **Enter Animation**

### **Timeline:**

**1. Heading (`.font-color-primary`)**
- **Start:** 0s
- **Duration:** 1s
- **Animation:** SplitText by chars, mask, animate from `y: 100%` → `0%`
- **Easing:** `expo.out`
- **Stagger:** 0.01s per character

**2. Filter Button (`#filters-open`)**
- **Start:** 0.2s
- **Duration:** 1s
- **Animation:** `y: 100%` → `0%`
- **Easing:** `expo.out`

**3. Product Items (`.collection_grid-item`)**
- **Start:** After skeletons fade out
- **Duration:** 0.6s
- **Animation:** `opacity: 0, y: 20px` → `opacity: 1, y: 0`
- **Easing:** `power2.out`
- **Stagger:** 0.03s per item

---

## 👋 **Exit Animation**

**Short and snappy - reverse of enter but faster!**

### **Timeline:**

**1. Heading Characters**
- **Start:** 0s
- **Duration:** 0.5s
- **Animation:** `y: 0%` → `y: -100%` (exit upward)
- **Easing:** `power2.in`
- **Stagger:** 0.008s per character

**2. Filter Button**
- **Start:** 0.05s
- **Duration:** 0.5s
- **Animation:** `y: 0%` → `y: 100%` (exit downward)
- **Easing:** `power2.in`

**3. Page Fade**
- **Start:** After exit animation completes
- **Duration:** 0.3s
- **Animation:** `opacity: 1` → `0`
- **Easing:** `power2.out`

---

## 🎭 **Loading States**

### **Skeleton Loaders**

**When Shown:**
- Initial page load (fetching data)
- Applying filters or sorting
- Infinite scroll (at bottom of page)

**Animation:**
- Pulsing gradient background
- Staggered appearance: 0.1s delay per skeleton
- Automatically removed when data arrives

**Minimum Display Time:** 150ms (prevents jarring flash if API is too fast)

### **Item Reveal**

**Behavior:**
- Items fade in from skeleton state
- Smooth opacity + Y offset animation
- Staggered for visual interest

**From Cache:**
- No skeleton shown
- Items animate in immediately (faster restore)

---

## 🔄 **Transition Flow**

```
USER NAVIGATES TO COLLECTIONS:
├─ Page fade in (0.3s)
├─ Enter animation plays (heading + filter button)
├─ Check for cached data
│  ├─ Yes: Render items immediately with animation
│  └─ No: Show skeletons → fetch → animate items in
└─ Ready for interaction

USER LEAVES COLLECTIONS:
├─ Exit animation plays (0.5s)
├─ Page fade out (0.3s)
└─ Navigate to new page
```

---

## 🎯 **Key Features**

✅ **Skeleton loaders** provide visual feedback during loading  
✅ **Staggered animations** create polished, professional feel  
✅ **Fast exit** keeps navigation snappy  
✅ **Cache-aware** - different loading states based on data availability  
✅ **No inline style conflicts** - GSAP handles all initial states  
✅ **Smooth item reveals** - opacity + subtle Y offset for elegance

---

## 🧪 **Testing Checklist**

- [ ] Initial load: heading → filter button → skeletons → items
- [ ] Filter change: skeletons → items animate in
- [ ] Infinite scroll: skeletons at bottom → new items animate in
- [ ] Navigate away: smooth exit animation
- [ ] Back button: instant restore from cache (no skeletons)
- [ ] Items fade in smoothly with Y offset
- [ ] No flash of unstyled content (FOUC)

