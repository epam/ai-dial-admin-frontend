# Events Grid Implementation Plan

## Overview
Update grid incrementally with new events while preserving scroll position using pure JS calculations.

## Approach

### 1. Track Previous Events
- Use `useRef` to store previous events array
- Compare current vs previous to detect new events
- Only process events that weren't in previous array

### 2. Use AG Grid Transactions
- Use `gridApi.applyTransaction({ add: [newEvents], addIndex: 0 })` to add new rows at top
- This avoids full component re-render
- Only updates the new rows, not entire grid

### 3. Calculate Scroll Position Shift
- Formula: `scrollShift = newItemsCount * ROW_HEIGHT`
- ROW_HEIGHT = 40px (from constants)

### 4. Preserve Scroll Position Logic
```javascript
const scrollContainer = gridElement.querySelector('.ag-body-viewport');
const scrollTop = scrollContainer.scrollTop;
const scrollHeight = scrollContainer.scrollHeight;
const clientHeight = scrollContainer.clientHeight;
const isAtTop = scrollTop <= 5; // Small threshold for "at top"
const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // Small threshold

if (isAtTop) {
  // Keep at top (no adjustment needed, new items appear above)
  scrollContainer.scrollTop = 0;
} else if (isAtBottom) {
  // Keep at bottom - scroll to new bottom
  scrollContainer.scrollTop = scrollContainer.scrollHeight;
} else {
  // Adjust scroll position by shift amount
  scrollContainer.scrollTop = scrollTop + scrollShift;
}
```

### 5. Implementation Flow
1. Component receives new events array
2. Compare with previous to find new events
3. If new events exist:
   - Get current scroll position
   - Determine if at top/bottom
   - Apply transaction to add new rows
   - Use `requestAnimationFrame` or `setTimeout` to adjust scroll after DOM update
   - Update previous events ref

## Key Points
- Use `useRef` for previous events (doesn't trigger re-render)
- Use `useMemo` for sorted events (only when events change)
- Access scroll container via DOM query (`.ag-body-viewport`)
- Use `requestAnimationFrame` or `setTimeout(0)` to ensure DOM is updated before adjusting scroll
- Row height is 40px (ROW_HEIGHT constant)
