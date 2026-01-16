# Scroll Position Preservation - Detailed Explanation

## Key Concepts

### 1. Incremental Updates with AG Grid Transactions
Instead of replacing all data, we use `applyTransaction` to add only new rows:
```typescript
gridApi.applyTransaction({
  add: newEvents,      // Only new events
  addIndex: 0,         // Insert at top (newest first)
});
```

**Benefits:**
- No full component re-render
- Only new rows are rendered
- Better performance
- Existing rows stay in place

### 2. Detecting New Events
Use a `Set` to track event IDs we've already seen:
```typescript
const previousEventsRef = useRef<Set<string>>(new Set());
const currentEventIds = new Set(sortedEvents.map(e => e.id));
const newEvents = sortedEvents.filter(e => !previousEventsRef.current.has(e.id));
```

### 3. Scroll Position Calculation

#### Finding the Scroll Container
AG Grid uses `.ag-body-viewport` as the scrollable container:
```typescript
const scrollContainer = containerRef.current.querySelector('.ag-body-viewport');
```

#### Scroll Position States

**At Top:**
```typescript
const isAtTop = scrollTop <= 5; // Small threshold
// Action: Keep scrollTop = 0
```

**At Bottom:**
```typescript
const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
// Action: Scroll to new bottom (scrollHeight after update)
```

**In Middle:**
```typescript
const scrollShift = newItemsCount * ROW_HEIGHT;
scrollTop = previousScrollTop + scrollShift;
// New items added at top push content down, so we shift scroll down
```

### 4. Timing: When to Adjust Scroll

**Problem:** DOM updates are asynchronous. We need to wait for AG Grid to apply the transaction.

**Solution:** Use `setTimeout(0)` or `requestAnimationFrame`:
```typescript
gridApi.applyTransaction({ add: newEvents, addIndex: 0 });

setTimeout(() => {
  // Now DOM is updated, adjust scroll
  scrollContainer.scrollTop = calculatedPosition;
}, 0);
```

## Flow Diagram

```
1. New events arrive via SSE
   ↓
2. Events added to state in ContainerView
   ↓
3. Events component receives updated events array
   ↓
4. useEffect detects new events (compare with previousEventsRef)
   ↓
5. If new events found:
   a. Capture current scroll position
   b. Determine if at top/bottom
   c. Apply transaction to add new rows
   d. Wait for DOM update (setTimeout)
   e. Adjust scroll position based on state
   f. Update previousEventsRef
```

## Edge Cases

### Initial Load
- First time: All events are "new"
- Initialize `previousEventsRef` with all event IDs
- No scroll adjustment needed (user hasn't scrolled yet)

### Multiple Events at Once
- SSE might send multiple events in one update
- Calculate total shift: `newEvents.length * ROW_HEIGHT`
- Apply single scroll adjustment

### User Scrolling While Events Arrive
- Scroll position is captured before transaction
- Adjustment happens after transaction
- User's scroll position is preserved relative to content

### Grid Not Ready Yet
- Check `if (!gridApi)` before processing
- Wait for grid to be ready

## Performance Considerations

1. **useRef for Previous Events**: Doesn't trigger re-renders
2. **useMemo for Sorting**: Only re-sorts when events array changes
3. **Transaction API**: Only updates new rows, not entire grid
4. **Set for Lookup**: O(1) lookup for event IDs

## Testing Scenarios

1. **Scroll at top, new event arrives**: Should stay at top
2. **Scroll at bottom, new event arrives**: Should stay at bottom (see new event)
3. **Scroll in middle, new event arrives**: Should shift down by 40px
4. **Multiple events arrive**: Should shift by (count * 40px)
5. **User scrolling while events arrive**: Should preserve relative position
