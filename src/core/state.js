// Page state management
const PageState = new Map();

export const setState = (ns, obj) => PageState.set(ns, obj);
export const getState = (ns) => PageState.get(ns) || {};
export const clearState = (ns) => PageState.delete(ns);

// Collections page snapshots - DISABLED for now (keeping for future use)
export const pageSnapshots = new Map();

// Snapshot functions commented out - will reimplement later if needed
export function saveCollectionsSnapshot(url = null) {
  // Disabled - not saving snapshots
}

export function restoreCollectionsSnapshotIfPossible() {
  // Disabled - always return false to force fresh initialization
  return false;
}
