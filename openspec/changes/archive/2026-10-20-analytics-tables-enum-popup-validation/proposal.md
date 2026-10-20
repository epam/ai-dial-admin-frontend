## Why

QA on #3847: the enum Values popup accepted a value of 65 to 255 characters and the column row then refused it
(limit 64, the service's), so the same value met two different limits and two messages. The popup is the shared
list popup, whose per-value rule (2 to 255 characters) was written for topics.

## What Changes

- **`Multiselect` takes an optional per-value check.** Without it the popup keeps the topic rule, so every
  existing caller is unchanged.
- **The enum Values popup passes the enum check**: a value longer than 64 characters (trimmed) is refused with the
  same message the column row shows, and Apply stays disabled until it is corrected. A single character is
  accepted, which the topic rule's two-character minimum refused.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: "A column may be declared with an enum type and a closed, ordered value list" (the popup
  checks the length like the row does).

## Non-goals

- Changing the service's limits or the topic rule.
- Moving the list-wide rules (at least one value, distinct values) into the popup.
