## 1. Models and API layer

- [x] 1.1 Add `QueryExprType.Param`, `QueryParamExpr` and the `CallerValueName` enum to `apps/ai-dial-admin/src/models/analytics/query.ts`; include the param expression in `QueryExpr`
- [x] 1.2 Add `IneffectiveGrantReason.LiftsRowPolicies` to `apps/ai-dial-admin/src/models/analytics/table.ts`
- [x] 1.3 Encode `*` as `%2A` in `TABLE_ROW_POLICY_URL` (`apps/ai-dial-admin/src/server/analytics/analytics-data-api.ts`)
- [x] 1.4 Give `summarizeExpr` in `components/Analytics/Tables/access/utils.ts` a `Param` case and a `default` that does not assume `args`

## 2. Everyone grantee

- [x] 2.1 Add `EVERYONE_ROLE` to `access/constants.ts` and a `roleLabel` helper to `access/utils.ts`; add the label, option description and lock-reason keys to `AnalyticsTableAccessI18nKey` (`src/constants/i18n.ts`) and `src/locales/en.ts`
- [x] 2.2 Show the label (with its decorative icon) in the roles grid's role cell and make the role search match it (`AccessTab.tsx`)
- [x] 2.3 Prepend the Everyone option to the picker in `RoleDrawer.tsx` independently of `useRoleCatalog`, and show the label for an edited `*` entry
- [x] 2.4 Lock **Write** and **Modify** for Everyone in `RoleDrawer.tsx` through one `lockedPrivileges` + reason computed from `isSystem` and the role
- [x] 2.5 Show the label in `RemoveRoleDialog.tsx` and in the save/remove notifications

## 3. Unconfined-Everyone warning and save order

- [x] 3.1 Show the warning `Notification` in the row step of `RoleDrawer.tsx` while Everyone + Read + All rows
- [x] 3.2 Save the row policy before the grants for Everyone with a row limit; keep `DrawerPhase.Editing` on either failure, as described in `design.md`

## 4. Caller value operand

- [x] 4.1 Add `FilterOperandKind.Param` and `rightParam` to `src/models/analytics/query-builder.ts`; initialize it in `QueryBuilder/utils/state.ts`
- [x] 4.2 Add `callerValues` to `FilterTreeContextValue` (`QueryBuilder/filter-tree-context.tsx`), empty for the Query Builder fallback
- [x] 4.3 Serialize and deserialize the param operand in `QueryBuilder/utils/serialize.ts` and `deserialize.ts`, including the column-first normalization and the representability rule
- [x] 4.4 Offer **Caller value** and its picker in `QueryBuilder/Filter/FilterCondition.tsx` under the operator/type rule, with the reset to a literal when the rule stops holding; include it in the collapsed summary
- [x] 4.5 Supply the two caller values from `access/RowLimitEditor.tsx`; a `Param` kind with no name is unfinished through `serializeNode` returning null, so `access/row-limit.ts` needs no change

## 5. Empty-result hint

- [x] 5.1 Add the hook that lazily reads the source table's `rows_restricted` through `getTable` beside `QueryBuilder/Result/ResultArea.tsx`, cached per source, silent on failure
- [x] 5.2 Show the hint as the empty state's description in `ResultArea.tsx` for Builder- and JSON-view runs only; add its i18n key

## 6. Unit tests

- [x] 6.1 `access/tests/utils.spec.ts`: `summarizeFilter` with a param on either side, `roleLabel`, `planAccessSave` for `*`
- [x] 6.2 `server/analytics/tests/analytics-data-api.spec.ts`: the row-policy path for `*`
- [x] 6.3 `access/tests/RoleDrawer.spec.tsx`: Everyone offered first and when the catalog failed, not offered twice, Write/Modify locked, the warning's presence and absence, policy-first order, a refused policy sends no grants, the `lifts_row_policies` banner
- [x] 6.4 `access/tests/AccessTab.spec.tsx`: the Everyone label and search; the remove dialog's title goes through `roleLabel`, covered in `utils.spec.ts`
- [x] 6.5 `QueryBuilder/utils/tests` for serialize/deserialize of the param operand, and `QueryBuilder/Filter/tests` for the offer rule, the reset, and the Query Builder not offering it
- [x] 6.6 `access/tests/RowLimitEditor.spec.tsx` and `row-limit.spec.ts`: a stored caller-value policy opens visually; an unpicked caller value is unfinished
- [x] 6.7 `QueryBuilder/Result` tests: the hint for a restricted source, none for an unrestricted one, a failed read, and a SQL-view run

## 7. Browser verification

- [x] 7.1 Run the `spec-browser-verify` skill for this change against the local stack (auth disabled, local analytics service on a build that has the `*` grantee and caller values), on a table created for the check rather than an existing one; resolve every `fail` verdict

## 8. Quality checks

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix what they report
