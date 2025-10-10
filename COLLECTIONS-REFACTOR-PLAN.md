# Collections Page Refactor Plan

## Current Issues:
1. ❌ URL params loaded but not used in first fetch
2. ❌ Missing items after cache restore (20/21)
3. ❌ Session restore overrides URL params on refresh
4. ❌ Complex tangled logic - hard to debug
5. ❌ Multiple sources of truth for state

## New Architecture:

### 1. **Clear Initialization Flow**
```
init() 
  ↓
Load URL Params → Set activeFilters & currentSort
  ↓
Check Session Cache
  ↓
  YES: Validate cache matches current URL
    ↓
    MATCH: Restore from cache
    NO MATCH: Clear cache, fetch fresh
  ↓
  NO: Fetch fresh with URL params
```

### 2. **State Management**
- Single source of truth for each piece of state
- Clear getter/setter pattern
- Validate state consistency

### 3. **Separation of Concerns**
```
StateManager
  - activeFilters
  - currentSort
  - currentPage
  - totalItems
  - hasMorePages
  - allLoadedItems

UIManager
  - renderItems()
  - animateItems()
  - updateControls()

CacheManager
  - save()
  - restore()
  - validate()
  - clear()

APIManager
  - buildUrl()
  - fetch()
  - handle response
```

## Key Fixes:

### Fix 1: URL Params Must Drive State
```javascript
// URL params are the SOURCE OF TRUTH on init
loadFromURLParams() {
  // Parse URL
  // Set activeFilters
  // Set currentSort
}

init() {
  // 1. Load URL params FIRST
  this.loadFromURLParams();
  
  // 2. Check if cache matches current URL state
  const cache = this.getCache();
  if (cache && this.cacheMatchesCurrentState(cache)) {
    this.restoreFromCache(cache);
  } else {
    // Cache invalid or doesn't match URL
    this.clearCache();
    this.fetchFresh();
  }
}
```

### Fix 2: Validate Cache Before Use
```javascript
cacheMatchesCurrentState(cache) {
  // Compare cache filters with current activeFilters
  // Compare cache sort with current sort
  // Only restore if they match!
}
```

### Fix 3: Fix Item Count
```javascript
renderItems(items, isRestore = false) {
  // Clear container
  this.productContainer.innerHTML = '';
  
  // Render all items
  items.forEach(item => this.appendItemElement(item));
  
  // Set state (don't override if restore)
  if (isRestore) {
    // Items already in this._allLoadedItems
  } else {
    this._allLoadedItems = [...items];
  }
}
```

## Implementation Order:
1. ✅ Create new clean file structure
2. ✅ Implement StateManager
3. ✅ Implement CacheManager with validation
4. ✅ Fix init flow
5. ✅ Test thoroughly

