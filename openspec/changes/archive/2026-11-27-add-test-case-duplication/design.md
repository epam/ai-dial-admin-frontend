## Context

The dataset detail Test Cases grid and the Test Suites Test Cases grid expose row actions through
their respective `TestCasesList` components. Test Suites can use a private dataset on that tab;
public datasets remain read-only. Test cases may contain shared `data` and an ordered
`multiTurnData` array.

## Goals / Non-Goals

**Goals:**
- Make duplication available from the row context menu in both editable grid surfaces.
- Preserve the source case's complete editable content, including every turn.
- Give the new case a unique ID and leave the source case unchanged.
- Persist the new case through the existing creation endpoint and refresh each grid.

**Non-Goals:**
- Duplicate cases in read-only public datasets.
- Change save APIs, import/export behavior, or test-suite-level duplication.

## Decisions

### Implement the action in both grid surfaces

Add the same localized **Duplicate** row action to the dataset grid and the private-dataset
Test Suites grid. Respect the existing read-only gating so a public dataset cannot be modified from
the suite tab.

### Create a new case immediately

The action calls the existing `createTestCase` server action with copied case values, then refreshes
the grid after success. This matches the existing Add Test Case action in both grid surfaces.
Creation failures use the grid's existing error notification behavior. The action does not mutate
the source case.

### Copy case content while replacing identity

Copy all shared data fields and the entire ordered turn sequence. The creation API assigns a new
unique ID, and the duplicate name uses the localized copy postfix with an incremented numeric suffix
when necessary, since the backend rejects duplicate names within a dataset. Preserve the existing
single-turn representation when the source has no turns array; when it is multi-turn, retain every
turn in its original order.

### Cover both behavior and presentation with component tests

Test that the action is available in both editable contexts, unavailable in the public read-only
context, and sends copied fields and turns to the creation action. Verify successful creation
refreshes the grid and failure uses the existing error notification.

## Risks / Trade-offs

- Shallow-copying nested case data could make edits to the duplicate affect the source. Copy nested
  field values and turn data independently.
- The creation API owns ID generation, so duplicate IDs are not selected by the client.

## Migration Plan

No persisted-data migration or backend change is required. Deploy the UI action with the existing
save behavior; rollback by reverting the frontend change.
