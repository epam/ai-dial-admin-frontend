## 1. Alias target path encoding (#5569)

- [x] 1.1 In `apps/ai-dial-admin/src/utils/aliases/target.ts`, make `toAliasTargetPath` percent-encode each segment of a Public pick's `entity.path` (`encodeURIComponent` per `/`-separated segment, separators kept); Platform and config.json picks stay `<type>/<name>`
- [x] 1.2 In the same file, make `parseAliasTargetPath` decode `reference` per segment, returning `null` (not throwing) for a malformed escape so `TargetField` keeps showing it as unparsable plain text
- [x] 1.3 Check that `components/Assets/Entities/Aliases/TargetField.tsx` and `View/Target.tsx` display the decoded reference and that a re-pick or save sends the encoded `target.path` unchanged

## 2. Picker grids (#5568)

- [x] 2.1 In `components/Assets/FlatAssetGrid/FlatAssetGrid.tsx`, when `isSelectMode`, build the name column with an href getter that returns `undefined`, so `DisplayNameCellRenderer` renders plain text and the radio/checkbox selection column is the only control
- [x] 2.2 In the same file, blank the empty-state `description` when `isSelectMode` or `source === AssetSource.ConfigFile`; the Platform and Public listing tabs keep the full text

- [x] 2.3 Single-select picker grids put the radio in the name cell (`RadioNameCellRenderer`, `SINGLE_ROW_SELECTION_NO_CHECKBOX`, row refresh on selection) instead of an empty selection column
- [x] 2.4 `TargetField` uses `InputPopup` (read-only input with open icon) instead of the Select/Change target button; drop the unused `Alias.SelectTarget`/`Alias.ChangeTarget` keys
- [x] 2.5 `PublicEntityTree` shows the breadcrumb trail and pads the tree from the top when it has no heading

## 3. Unit tests

- [x] 3.1 Extend `utils/aliases/tests/target.spec.ts`: encode with spaces and other reserved characters, plain paths unchanged, decode round trip, malformed escape parses to `null`, Platform/config.json names unchanged
- [x] 3.2 Extend `components/Assets/FlatAssetGrid/tests/`: select mode renders no link for the name; empty-state description absent in select mode and on config.json, present on the Platform listing tab
- [x] 3.3 Cover `TargetField` with an encoded stored path (readable display, encoded value on change)

## 4. Quality checks

- [ ] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the affected specs; then the full `npm run test` as the final gate

<!-- No browser-verification task: declined by the user; behaviour is covered by the unit and component tests above. -->
