# Complete Scroll Behavior Guide

## 📋 Overview

This document explains ALL scroll-related behavior in the codebase and how different scenarios are handled.

---

## 🎯 Core Scroll Management

### 1. **Browser Native Scroll Restoration: DISABLED**

**File:** `src/taxi.js` (Line 52-55)
```javascript
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
```

**Why:** We handle all scroll restoration manually for precise control during SPA transitions.

---

## 🔄 Navigation Scenarios

### Scenario 1: **Forward Navigation** (Click any link)

**Result:** New page appears at top (scroll: 0)

**How it works:**
1. Click link → Taxi.js intercepts
2. Current page fades out (0.3s) - no scroll change
3. New page content loads
4. New page fades in at top (scroll is naturally 0)

**Files involved:**
- `src/transitions/DefaultTransition.js` - Fade animations only
- No explicit `scrollTo(0, 0)` needed - new content starts at top naturally

---

### Scenario 2: **Back Button** (Browser back from product → collections)

**Result:** Collections page restored with previous scroll position

**How it works:**
1. On leaving collections → Save snapshot with scroll position
2. Click product link → Navigate away
3. Hit back button → Collections renderer detects snapshot
4. Restore entire page state + scroll to saved position

**Files involved:**
- `src/taxi.js` (Line 58-68) - Saves snapshot when leaving collections
- `src/core/state.js` (Line 11-34) - `saveCollectionsSnapshot()` - Saves HTML + scroll
- `src/core/state.js` (Line 106-109) - `restoreCollectionsSnapshotIfPossible()` - Restores scroll
- `src/renderers/CollectionsRenderer.js` - Calls restore on enter

**Code:**
```javascript
// Save when leaving
const snapshot = {
  html: grid.innerHTML,
  state: filterState,
  scrollY: window.scrollY,  // ← Current scroll position saved
};

// Restore on back button
if (snap.scrollY !== undefined) {
  requestAnimationFrame(() => {
    window.scrollTo(0, snap.scrollY);  // ← Scroll restored
  });
}
```

---

### Scenario 3: **Navigation Menu Open → Click Link**

**Result:** Menu closes, page transitions, no scroll jump

**How it works:**
1. Nav is open (body has `position: fixed`, scroll locked)
2. Click nav link → `closeNav(true)` called with skip flag
3. Unlocks body (removes fixed positioning)
4. Does NOT restore scroll (skip = true)
5. Taxi.js handles smooth transition
6. New page appears at top

**Files involved:**
- `src/components/navigation.js` (Line 28-48) - `closeNav(skipScrollRestore)`
- `src/taxi.js` (Line 67) - Calls `closeNav(true)` during navigation

**Code:**
```javascript
export function closeNav(skipScrollRestore = false) {
  if (navIsOpen) {
    // Unlock body
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Only restore scroll if NOT navigating
    if (!skipScrollRestore) {
      window.scrollTo(0, scrollPosition);  // Only for ESC/close button
    }
    
    navIsOpen = false;
  }
}
```

---

### Scenario 4: **Navigation Menu Open → Press ESC or Close Button**

**Result:** Menu closes, scroll position restored to where it was before opening menu

**How it works:**
1. Nav is open (body locked at some scroll position)
2. Press ESC or click close button → `closeNav()` called WITHOUT skip flag
3. Unlocks body
4. Restores scroll to saved position

**Files involved:**
- `src/components/navigation.js` (Line 14-26) - `openNav()` saves position
- `src/components/navigation.js` (Line 28-48) - `closeNav()` restores position

**Code:**
```javascript
// When opening nav
export function openNav() {
  scrollPosition = window.pageYOffset;  // ← Save current scroll
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;  // Lock at current position
}

// When closing nav (not navigating)
closeNav()  // No parameter → restores scroll
```

---

### Scenario 5: **Filter Drawer Open → Close**

**Result:** Drawer closes, scroll position restored

**How it works:**
1. Open filter drawer → Lock scroll, save position
2. Close drawer → Restore scroll to saved position

**Files involved:**
- `src/components/filterDrawer.js` (Line 28-48) - Open: save scroll + lock
- `src/components/filterDrawer.js` (Line 51-76) - Close: restore scroll

**Code:**
```javascript
// On open
scrollPosition = window.pageYOffset;
document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollPosition}px`;

// On close
document.body.style.overflow = '';
document.body.style.position = '';
document.body.style.top = '';
window.scrollTo(0, scrollPosition);  // ← Restore
```

---

## 📊 Summary Table

| Scenario | Scroll Behavior | Files Involved |
|----------|----------------|----------------|
| **Forward navigation** | New page at top (natural) | `DefaultTransition.js` |
| **Back button** | Restore saved position | `state.js`, `CollectionsRenderer.js` |
| **Nav link click** | No scroll change during transition | `navigation.js`, `taxi.js` |
| **Nav ESC/close** | Restore to pre-nav position | `navigation.js` |
| **Filter drawer close** | Restore to pre-drawer position | `filterDrawer.js` |

---

## 🔍 Key Concepts

### 1. **Body Scroll Locking**
When menus/drawers open, we use `position: fixed` to prevent scrolling:
```javascript
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollY}px`;  // Maintains visual position
```

This prevents the page from scrolling while keeping it visually in the same place.

### 2. **Skip Scroll Restore Flag**
The `closeNav(skipScrollRestore)` parameter determines behavior:
- `closeNav()` → Restores scroll (ESC, close button)
- `closeNav(true)` → Skips restore (link clicks during navigation)

### 3. **Collections Page Snapshot**
The collections page is special - it saves:
- Entire product grid HTML
- Filter state
- **Scroll position**
- Current page number

When you hit back, everything is restored instantly - no API refetch needed!

### 4. **RequestAnimationFrame for Scroll**
When restoring scroll, we use `requestAnimationFrame()`:
```javascript
requestAnimationFrame(() => {
  window.scrollTo(0, snap.scrollY);
});
```

This ensures the DOM is fully rendered before scrolling.

---

## 🚫 What We DON'T Do

### ❌ No scroll-to-top on forward navigation
We don't need `window.scrollTo(0, 0)` because new page content naturally starts at top.

### ❌ No scroll during transitions
Transitions only fade opacity - no scroll changes during animation.

### ❌ No browser scroll restoration
We disabled `history.scrollRestoration = 'manual'` to prevent conflicts.

---

## 🐛 Previous Bug (FIXED in v3.3.0)

**The Problem:**
```javascript
// OLD CODE - Bug!
export function closeNav() {
  window.scrollTo(0, scrollPosition);  // ← Always ran, even when nav wasn't open!
}
```

Every link click called `closeNav()`, which scrolled to top if `scrollPosition = 0`.

**The Fix:**
```javascript
// NEW CODE - Fixed!
export function closeNav(skipScrollRestore = false) {
  if (navIsOpen && !skipScrollRestore) {  // ← Only restore if nav was open AND not navigating
    window.scrollTo(0, scrollPosition);
  }
}
```

---

## 📝 Quick Reference

### Where scroll is SAVED:
1. Navigation menu open → `navigation.js` line 20
2. Filter drawer open → `filterDrawer.js` line 33
3. Collections page leaving → `state.js` line 30

### Where scroll is RESTORED:
1. Navigation menu close → `navigation.js` line 42
2. Filter drawer close → `filterDrawer.js` line 65
3. Collections back button → `state.js` line 108

### Where scroll is NOT touched:
1. Forward navigation → `DefaultTransition.js` (just fades)
2. Regular page transitions → Taxi.js core handles it

---

## 🎯 Current Status

**Everything works correctly!** ✅

- ✅ Forward navigation: Smooth fade, new page at top
- ✅ Back button: Instant restore with scroll position
- ✅ Navigation menu: Proper scroll lock/restore
- ✅ Filter drawer: Proper scroll lock/restore
- ✅ No scroll jumping anywhere

---

**Last Updated:** v3.3.1

