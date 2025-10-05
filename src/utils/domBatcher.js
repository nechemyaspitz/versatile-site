// Batch DOM operations to avoid layout thrashing

let readQueue = [];
let writeQueue = [];
let scheduled = false;

/**
 * Schedule a DOM read operation
 */
export function scheduleRead(fn) {
  readQueue.push(fn);
  scheduleFlush();
}

/**
 * Schedule a DOM write operation
 */
export function scheduleWrite(fn) {
  writeQueue.push(fn);
  scheduleFlush();
}

/**
 * Schedule the flush
 */
function scheduleFlush() {
  if (scheduled) return;
  scheduled = true;
  
  requestAnimationFrame(() => {
    flush();
  });
}

/**
 * Flush all queued operations (read first, then write)
 */
function flush() {
  // Execute all reads first
  const reads = readQueue.slice();
  readQueue = [];
  reads.forEach(fn => fn());
  
  // Then execute all writes
  const writes = writeQueue.slice();
  writeQueue = [];
  writes.forEach(fn => fn());
  
  scheduled = false;
  
  // If new operations were queued during execution, schedule another flush
  if (readQueue.length > 0 || writeQueue.length > 0) {
    scheduleFlush();
  }
}

/**
 * Batch a function call to next frame
 */
export function batchToNextFrame(fn) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      fn();
      resolve();
    });
  });
}

