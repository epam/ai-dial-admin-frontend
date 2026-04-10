## ADDED Requirements

### Requirement: getDetailEntries preserves string-array values

`getDetailEntries(data: Record<string, unknown>)` SHALL return `Array<[string, string | string[]]>`.

When a value in `data` is an array where every element is a `string`, the function SHALL return it as `string[]` (not serialised or joined).

When a value is any other type (number, boolean, object, mixed array, null, undefined), the function SHALL return `String(val)` as before.

#### Scenario: String-array value returned as string[]

- **WHEN** `getDetailEntries` is called with `{ tags: ['alpha', 'beta', 'gamma'] }`
- **THEN** the result contains `['tags', ['alpha', 'beta', 'gamma']]`

#### Scenario: Non-string-array value stringified

- **WHEN** `getDetailEntries` is called with `{ count: 42 }`
- **THEN** the result contains `['count', '42']`

#### Scenario: Mixed array stringified

- **WHEN** `getDetailEntries` is called with `{ mixed: ['a', 1, true] }`
- **THEN** the result contains `['mixed', 'a,1,true']` (fallback to `String()`)

#### Scenario: Object value stringified

- **WHEN** `getDetailEntries` is called with `{ meta: { x: 1 } }`
- **THEN** the result contains `['meta', '[object Object]']`

### Requirement: AdaptiveValueRow renders string-array values as stacked lines

When `AdaptiveValueRow` receives a `value` of type `string[]`, it SHALL render each element as a separate `<span>` stacked vertically in the value column. The existing JSON expand/collapse logic (`parseValue`) SHALL NOT be invoked for `string[]` values.

The copy button SHALL copy all items joined by newline (`\n`) to the clipboard.

#### Scenario: String-array renders each item on its own line

- **WHEN** `AdaptiveValueRow` is rendered with `value={['item one', 'item two', 'item three']}`
- **THEN** 'item one', 'item two', and 'item three' are each visible as separate elements in the DOM

#### Scenario: Copy button for string array copies newline-joined value

- **WHEN** the user clicks the copy button on a row with `value={['a', 'b']}`
- **THEN** the clipboard receives `'a\nb'`

#### Scenario: Empty string array renders empty value column

- **WHEN** `AdaptiveValueRow` is rendered with `value={[]}`
- **THEN** the value column is empty but the label and copy button are still rendered

### Requirement: AdaptiveValueGrid accepts string-array entry values

`AdaptiveValueGrid.entries` prop type SHALL be `Array<[string, string | string[]]>`. The component SHALL pass each value directly to `AdaptiveValueRow` without modification.

#### Scenario: Grid passes string-array value to row

- **WHEN** `AdaptiveValueGrid` is rendered with `entries={[['tags', ['a', 'b']]]}` and expanded
- **THEN** both 'a' and 'b' are visible as stacked items in the row
