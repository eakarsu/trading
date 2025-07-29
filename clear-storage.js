// Clear localStorage script for debugging
// Run this in the browser console to clear any corrupted localStorage data

console.log('Clearing localStorage...');

// Clear all localStorage
localStorage.clear();

// Clear sessionStorage as well
sessionStorage.clear();

// Clear any specific trading app keys that might be corrupted
const keysToRemove = [
  'token',
  'user',
  'marketData',
  'stockPicks',
  'marketAnalysis',
  'portfolio',
  'strategies',
  'predictions'
];

keysToRemove.forEach(key => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn(`Could not remove ${key}:`, e);
  }
});

console.log('Storage cleared successfully!');
console.log('Please refresh the page and try logging in again.');
