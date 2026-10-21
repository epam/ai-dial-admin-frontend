## 1. Tab wiring

- [x] 1.1 Add an `ApplicationRoute.PlatformRoles` branch to `getTabsForAsset`
      (`apps/ai-dial-admin/src/utils/tabs/utils.ts`) returning `[propertiesTab(t), entitiesTab(t)]`.
- [x] 1.2 Render the new tab in `apps/ai-dial-admin/src/components/Assets/Platform/Roles/TabsContent.tsx`
      for `EntityViewTab.Entities`, passing `selectedRole`/`isSkipRefresh`/`onChange` through to the new
      Entities component (task 2.1).

## 2. Entities tab and grid

- [x] 2.1 Create `apps/ai-dial-admin/src/components/Assets/Platform/Roles/Entities.tsx`: header
      `Entities: {n}` (n = `Object.keys(selectedRole.limits ?? {}).length`), `+Add` action gated on
      `isReadOnlyAdmin` (mirror `CostLimits.tsx`/`Sharing.tsx`'s gating), and the Entities grid.
- [x] 2.2 Add a models-column-defs helper (new file, e.g.
      `apps/ai-dial-admin/src/components/Assets/Platform/Roles/entities-columns.ts`) building `Name` +
      four token columns (`Tokens per minute/day/week/month`), reusing
      `Grid/CellRenderers/EditableCellRenderer` and following the `createLimitColumn` shape in
      `EntityView/Roles/utils.ts` but adapted for plain-number values and key-absence-as-no-limit (no
      `UNLIMITED_VALUE` sentinel, no `defaultRoleLimit`). Render the "No limits" placeholder when a
      token key is absent.
- [x] 2.3 Add a row-mapping helper turning `selectedRole.limits` entries into grid rows (name + the four
      token values, `undefined` where the key is absent) plus a row-removal action per
      `.claude/rules/components.md` §11 (ag-grid conventions) that deletes the row's key from `limits`.
- [x] 2.4 Wire token-cell edits to update `selectedRole.limits["<model-name>"][token]` as a number
      (including `0`), via `onChange(updatedRole, /* isSkipRefresh */ true)`, following the
      `SchemaManager.tsx`/`EntityView/Roles` ref + `isSkipRefresh` convention so sequential edits across
      rows don't rebuild the grid (design.md "Multi-row stable editing"). Clearing a cell's value must
      delete that key from the entry rather than writing `null`/`''`/`0`.
- [x] 2.5 Hide the editable-cell triangle for each Platform Role token-limit column and add a Set unlimited
      row action immediately before Remove. Set unlimited must clear the selected model's token keys while
      retaining its empty `limits` entry and row.

## 3. Add-model popup

- [x] 3.1 Fetch the merged platform + config-file model population for the add popup, reusing the same
      source `Assets > Models` reads (`readConfigEntities`/`ConfigFileEntityType.Models`) rather than
      building a second merge.
- [x] 3.2 Filter out models already present as keys in `selectedRole.limits` before passing rows to the
      popup.
- [x] 3.3 Open `EntityView/AddEntitiesGrid` with a `Name` (+ `withSourceColumn`-derived Source) column
      set, multi-select enabled (the shared component already supports this).
- [x] 3.4 On apply, insert `limits["<model-name>"] = {}` for each newly selected model not already
      present, merging into `selectedRole.limits` (preserve any existing entry if one already exists for
      a given name) and call `onChange` with a normal (non-skip-refresh) update so the grid picks up the
      new rows.

## 4. Save-path verification

- [x] 4.1 Confirm `updateRole`'s existing write-normalization
      (`apps/ai-dial-admin/src/app/[lang]/platform-roles/actions.ts`,
      `apps/ai-dial-admin/src/utils/roles/limits.ts`) round-trips a per-model `limits` entry that has
      zero token keys (`{}`) as "attached, no limits" rather than stripping it. Adjust the
      normalization if it currently drops empty objects.

## 5. Tests

- [x] 5.1 Unit tests for the row-mapping/column helpers (task 2.2/2.3): no-limits placeholder when a
      key is absent, `0` rendered and stored distinctly from absence, clearing removes only the edited
      key, row survives when all four keys are removed.
- [x] 5.2 Unit tests for the add-popup filtering/merge helpers (task 3.1/3.2/3.4): excludes already-
      attached models, inserts empty entries for newly added ones, preserves an existing entry's values
      when the model was already present.
- [x] 5.3 Component test for `Entities.tsx`: header count, `+Add` opens the popup, read-only admin sees
      no add/remove affordances, selecting multiple models in the popup adds all of them as rows.
- [x] 5.4 Component test asserting a token edit on one row does not reset or re-render another row's
      in-progress state (isSkipRefresh behavior).
- [x] 5.5 Update/extend `platform-roles/actions.spec.ts` for the task 4.1 round-trip behavior if the
      normalization needed a change.
- [x] 5.6 Test triangle suppression and the Set unlimited row action: action order, clearing all token
      keys while preserving the model's empty entry and sibling models, and read-only action gating.

Browser verification was offered and declined by the user; no `spec-browser-verify` task is included.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test`
      suite; fix any failures.
