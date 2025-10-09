# 🔍 Scroll Jump Diagnostic Guide

## v3.1.8-DIAGNOSTIC is Now Live

I've deployed a special diagnostic version that will tell us EXACTLY why the scroll jump is happening.

---

## 📋 How to Diagnose

### Step 1: Open Your Site
Visit your live Webflow site (wait 30-60 seconds for GitHub Pages to update)

### Step 2: Open Browser Console
- **Chrome/Edge:** Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Safari:** Enable Dev Tools in Preferences, then `Cmd+Option+I`
- Click the "Console" tab

### Step 3: Check Initial Load Messages

You should see:
```
🚕 Versatile Site v3.1.8-DIAGNOSTIC - Powered by Taxi.js
🔍 DIAGNOSTIC MODE: Tracking all clicks and scroll behavior
🎯 Initializing Taxi.js...
🔍 HTML Structure Check:
  data-taxi element: ✅ FOUND  (or ❌ NOT FOUND)
  data-taxi-view element: ✅ FOUND  (or ❌ NOT FOUND)
🚀 Taxi.js ready! Navigation enabled.
```

### Step 4: Click a Link

Watch the console closely when you click ANY link on the site.

---

## 🎯 What to Look For

### Scenario A: Missing HTML Structure (MOST LIKELY)

**Console shows:**
```
❌ NOT FOUND
⚠️⚠️⚠️ CRITICAL ERROR ⚠️⚠️⚠️
Your Webflow HTML is missing data-taxi or data-taxi-view!
This is WHY the page jumps - Taxi.js cannot work without proper HTML structure!
```

**When you click a link:**
```
🖱️ LINK CLICKED: { href: "/some-page", scrollBefore: 350, ... }
❌ SCROLL JUMPED IMMEDIATELY! Browser default behavior is running!
   This means Taxi.js did NOT intercept the click!
```

**This means:**
- ✅ **ROOT CAUSE CONFIRMED:** Your Webflow HTML doesn't have `data-taxi` / `data-taxi-view`
- ✅ **FIX:** Follow `TAXI-WEBFLOW-SETUP.md` to update your Webflow HTML structure
- ❌ Taxi.js cannot intercept links without proper HTML structure
- ❌ Browser is doing full page reloads (causing instant scroll-to-top)

---

### Scenario B: HTML Structure is Correct (LESS LIKELY)

**Console shows:**
```
✅ FOUND
✅ FOUND
🚀 Taxi.js ready! Navigation enabled.
```

**When you click a link:**
```
🖱️ LINK CLICKED: { href: "/some-page", scrollBefore: 350, ... }
📤 NAVIGATE_OUT: home
👋 Default transition: leaving
(no immediate scroll jump error)
```

**This means:**
- ✅ Taxi.js IS intercepting links correctly
- ❓ Scroll jump is happening during the transition
- 🔍 Need to investigate transition timing further

---

### Scenario C: Taxi.js Not Loaded

**Console shows:**
```
❌ Taxi.js not found! Make sure BOTH @unseenco/e AND @unseenco/taxi CDN scripts are loaded.
❌ Taxi.js failed to initialize!
```

**This means:**
- ❌ CDN scripts are not loaded in Webflow
- ❌ Check Webflow → Site Settings → Custom Code → Footer Code
- ✅ **FIX:** Add the Taxi.js CDN scripts (see `TAXI-WEBFLOW-SETUP.md`)

---

## 📸 Send Me Screenshots

After you complete the diagnostic, please send me:

1. **Initial load messages** (the HTML structure check)
2. **Messages that appear when you click a link**
3. **Any error messages in red**

This will tell me EXACTLY what's wrong and how to fix it!

---

## 🎯 Most Likely Issues (Ranked)

### 1. Missing `data-taxi` / `data-taxi-view` (90% chance)
**Symptoms:**
- Console shows "NOT FOUND"
- "Browser default behavior is running!"
- Page reloads completely instead of smooth transition

**Fix:** Update Webflow HTML structure (see `TAXI-WEBFLOW-SETUP.md`)

---

### 2. Wrong CDN Scripts (8% chance)
**Symptoms:**
- "Taxi.js not found!"
- "taxi is undefined"

**Fix:** Update CDN scripts in Webflow footer code

---

### 3. Other Issue (2% chance)
**Symptoms:**
- HTML structure is ✅ FOUND
- Taxi.js is ✅ ready
- But scroll still jumps

**Fix:** Will need to investigate transition timing or CSS conflicts

---

## 💡 Quick Test

Try this in the console:

```javascript
// Check if Taxi.js is loaded
console.log('Taxi.js loaded?', typeof window.taxi !== 'undefined');

// Check HTML structure
console.log('data-taxi?', !!document.querySelector('[data-taxi]'));
console.log('data-taxi-view?', !!document.querySelector('[data-taxi-view]'));

// Check what's actually in the HTML
console.log('Body HTML:', document.body.innerHTML.slice(0, 500));
```

This will show us if the HTML has the right attributes.

---

## 🚀 Next Steps

1. Run the diagnostic on your live site
2. Send me the console output
3. Based on the results, we'll know the exact fix needed

**I'm 95% confident the issue is missing `data-taxi` / `data-taxi-view` in your Webflow HTML.**

Once we confirm this, updating the HTML structure will fix the scroll jump issue completely!

