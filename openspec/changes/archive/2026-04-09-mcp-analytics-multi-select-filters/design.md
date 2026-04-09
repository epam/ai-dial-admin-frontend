## Context

The MCP Analytics dashboard allows users to filter data by Entity (deployment) or Project. Currently, each filter can only hold a single value, requiring users to create multiple separate filters to view data across multiple deployments.

The issue manifests as a state management bug when adding filters: the dropdown shows the previously selected entity instead of allowing a new selection. However, the root cause is architectural - the system isn't designed for the multi-select use case users need.

### Current Architecture

```
FilterData Model (models/telemetry.ts:23-27)
┌──────────────────────────────┐
│ type: FILTER_TYPE            │
│ condition: FILTER_OPERATOR   │
│ value: string  ← Single only │
└──────────────────────────────┘

Filter State Flow
═════════════════
Filters.tsx (parent)
  └─> AddFilter (state: type, condition, value: string)
       └─> AddFilterPopover/Modal
            └─> CreateFilter
                 └─> DialSelectField (supports multi, but unused)
```

### Bug Symptom

When `value=''` after reset, `DialSelectField` gets `value={undefined}` because:
```tsx
entities.find((item) => item.value === '')?.value  // → undefined
```

This causes the select to display stale selection state instead of clearing.

## Goals / Non-Goals

**Goals:**
- Enable multi-select for Entity/Project dropdowns
- Support multiple values in a single filter
- Generate correct queries for multi-value filters (`$in`/`$nin` operators)
- Smart display of selected values in filter chips

**Non-Goals:**
- Multi-select for text input conditions (Contains, StartsWith, etc.)
- Migration of existing saved filters
- Advanced features (search, virtualization, keyboard shortcuts)

## Decisions

### 1. Always Enable Multi-Select for Dropdowns

**Decision**: Multi-select is always available when using Equal/NotEqual conditions with Entity or Project types.

**Rationale**:
- Simplifies UX - no toggle needed
- Matches user mental model - "show me data for these deployments"
- DialSelectField already supports multi-select natively
- Single-value case is just array with one item

**Alternative considered**: Conditional toggle to enable/disable multi-select. Rejected because it adds UI complexity for little benefit.

### 2. Display Strategy: First Two + Count

**Decision**:
- 1-2 values: Show all comma-separated `"MCP-1, MCP-2"`
- 3+ values: Show first two + count `"MCP-1, MCP-2, +3 more"`

**Rationale**:
- Balances information density with readability
- User can always click to edit and see full list
- Consistent with common multi-select chip patterns

**Implementation**:
```tsx
const displayValue = (values: string[]): string => {
  if (values.length <= 2) {
    return values.join(', ');
  }
  return `${values.slice(0, 2).join(', ')}, +${values.length - 2} more`;
};
```

### 3. Query Generation for Multi-Value

**Decision**: Use `$in` and `$nin` operators for array values.

**Query Logic**:
```tsx
// Single value (backward compatible)
{ deployment: { $eq: 'MCP-1' } }

// Multiple values
{ deployment: { $in: ['MCP-1', 'MCP-2', 'MCP-3'] } }

// NotEqual with multiple values
{ deployment: { $nin: ['MCP-1', 'MCP-2'] } }
```

**Rationale**: Standard MongoDB-style query operators, likely already supported by backend analytics engine.

**Risk Mitigation**: If backend doesn't support `$in`/`$nin`, fallback to OR/AND composition:
```tsx
// Fallback for $in
{ $or: [
  { deployment: { $eq: 'MCP-1' } },
  { deployment: { $eq: 'MCP-2' } }
]}
```

### 4. Data Model: Always Array

**Decision**: Change `FilterData.value` from `string` to `string[]` (always array, even for single value).

**Rationale**:
- Simpler logic - no union type handling
- Consistent state management
- Single value is just `['value']` instead of `'value'`
- Easier to test and reason about

**Migration**: No backward compatibility - this is a breaking change. Any saved filters in localStorage or URLs will need to be invalidated/migrated.

### 5. Bug Fix: Condition Dropdown

**Bonus Fix**: Correct the typo on line 101 of CreateFilter.tsx:
```tsx
// CURRENT (BUG):
value={filterConditionConfig.find((item) => item.value === type)?.value}

// FIXED:
value={filterConditionConfig.find((item) => item.value === condition)?.value}
```

## Component Changes

### CreateFilter.tsx (Lines 99-125)

**Current**:
```tsx
<DialSelectField
  value={entities.find((item) => item.value === value)?.value}
  id="entities"
  onChange={(type) => setValue(type as string)}
  options={entities}
/>
```

**Proposed**:
```tsx
<DialSelectField
  value={value}  // Now accepts string[]
  id="entities"
  onChange={(selected) => setValue(selected as string[])}
  options={entities}
  isMulti={true}  // Enable multi-select
  placeholder={value.length === 0 ? 'Select entities...' : undefined}
/>
```

**Changes**:
- Remove `.find()` logic - pass array directly
- Add `isMulti={true}`
- Cast `onChange` to `string[]`
- Add placeholder for empty state

### Filter.tsx (Line 41)

**Current**:
```tsx
<span className="mr-1 max-w-[250px] break-words">{value}</span>
```

**Proposed**:
```tsx
<span className="mr-1 max-w-[250px] break-words">
  {value.length <= 2
    ? value.join(', ')
    : `${value.slice(0, 2).join(', ')}, +${value.length - 2} more`}
</span>
```

### AddFilter.tsx (Lines 30-42)

**Current**:
```tsx
const [value, setValue] = useState<string>(filterData?.value ?? '');

const reset = useCallback(() => {
  // ...
  setValue(filterData?.value ?? '');
}, [filterData, ...]);
```

**Proposed**:
```tsx
const [value, setValue] = useState<string[]>(filterData?.value ?? []);

const reset = useCallback(() => {
  setType((filterData?.type ?? typeValue ?? filterTypeConfig[0].value) as FILTER_TYPE);
  setCondition((filterData?.condition ?? filterConditionConfig[0].value) as FILTER_OPERATOR);
  setValue(filterData?.value ?? []);
}, [filterData, typeValue, filterTypeConfig, filterConditionConfig]);
```

### CreateFilter.tsx - Type/Condition Handlers (Lines 43-79)

**Current**: Handlers set `value` to first entity/project on type/condition change.

**Proposed**: Reset to empty array `[]` instead:
```tsx
const setConditionHandler = useCallback(
  (newCondition: FILTER_OPERATOR) => {
    setCondition((prev) => {
      if (prev !== newCondition) {
        if (newCondition === FILTER_OPERATOR.Equal || newCondition === FILTER_OPERATOR.NotEqual) {
          setValue([]);  // Empty array for multi-select
        } else {
          setValue(['']);  // Single empty string for text input
        }
      }
      return newCondition;
    });
  },
  [setCondition, setValue],
);

const setTypeHandler = useCallback(
  (newType: FILTER_TYPE) => {
    setType((prev) => {
      if (prev !== newType) {
        if (condition === FILTER_OPERATOR.Equal || condition === FILTER_OPERATOR.NotEqual) {
          setValue([]);  // Clear selection when switching Entity ↔ Project
        }
      }
      return newType;
    });
  },
  [setType, condition, setValue],
);
```

### utils/telemetry.ts - Query Generation

**Current** (approximate):
```tsx
export const getFormattedDataFilters = (filters: FilterData[], ...) => {
  return filters?.map((filter) => {
    const filterConfig = filterTypeConfig.find((item) => item.value === filter.type);
    const filterName = filterConfig?.filter;
    const operator = filterOperatorConfig.find((item) => item.value === filter.condition);

    return {
      [filterName]: {
        [operator?.operator || '$eq']: filter.value,
      },
    };
  }) || [];
};
```

**Proposed**:
```tsx
export const getFormattedDataFilters = (filters: FilterData[], ...) => {
  return filters?.map((filter) => {
    const filterConfig = filterTypeConfig.find((item) => item.value === filter.type);
    const filterName = filterConfig?.filter;
    const operator = filterOperatorConfig.find((item) => item.value === filter.condition);

    // Handle multi-value filters
    if (filter.value.length > 1) {
      if (filter.condition === FILTER_OPERATOR.Equal) {
        return {
          [filterName]: {
            $in: filter.value,  // IN operator for multiple values
          },
        };
      } else if (filter.condition === FILTER_OPERATOR.NotEqual) {
        return {
          [filterName]: {
            $nin: filter.value,  // NOT IN operator
          },
        };
      }
    }

    // Single value or text conditions
    return {
      [filterName]: {
        [operator?.operator || '$eq']: filter.value[0] || '',
      },
    };
  }) || [];
};
```

## Validation Changes

**AddFilterModal.tsx / AddFilterPopover.tsx**:

```tsx
// Disable submit if array is empty
disableSubmitButton={
  !(type && condition && value.length > 0)
}
```

## Risks / Trade-offs

### Risk 1: Backend Query Support [High]
**Issue**: Backend analytics engine might not support `$in`/`$nin` operators.

**Mitigation**:
- Test with backend team before full rollout
- Have fallback to OR/AND composition
- Add feature flag to toggle between implementations

### Risk 2: DialSelectField API [Medium]
**Issue**: UI kit's DialSelectField might not have `isMulti` prop or might use different prop name.

**Mitigation**:
- Check @epam/ai-dial-ui-kit documentation
- Test locally before implementing
- If not supported, consider alternate multi-select component

### Risk 3: Performance with Large Lists [Low]
**Issue**: Multi-select with 100+ deployment options could be slow.

**Mitigation**:
- Current deployment lists are typically small (<50 items)
- Add virtualization later if needed
- Could add search/filter within dropdown

### Risk 4: Breaking Change [Medium]
**Issue**: Changing `value` from `string` to `string[]` breaks any saved filter state.

**Mitigation**:
- Accept breaking change (filters are session-scoped, not persisted)
- If filters ARE saved: add migration logic to wrap strings in arrays
- Clear localStorage filter keys on deploy

## Testing Strategy

**Unit Tests**:
- FilterData with array values
- Query generation for `$in`/`$nin`
- Display logic for 1, 2, 3+ values
- State reset with empty arrays

**Integration Tests**:
- Add filter with multiple entities
- Edit existing multi-value filter
- Remove filter
- Switch between type/condition with multi-values

**Manual Testing**:
- Create filter with 1, 2, 5+ values
- Verify query results match expectations
- Test on both desktop and mobile (modal vs popover)
- Verify keyboard navigation in multi-select

## Open Questions

1. **Does backend support `$in`/`$nin` operators?**
   - Need to verify with backend team
   - Check existing query examples

2. **What's the actual prop name for multi-select in DialSelectField?**
   - Could be `isMulti`, `multiple`, `multi`, or `isMultiSelect`
   - Need to check UI kit source or docs

3. **Should we show a "Select All" / "Clear All" option?**
   - Not in scope for initial implementation
   - Could add later based on user feedback

4. **How to handle very long entity names?**
   - Current: `max-w-[250px] break-words`
   - With multiple values, might need ellipsis per item
   - Address in implementation if needed
