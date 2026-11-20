## 1. Shared button and rule

- [x] 1.1 Confirm `GhostIconButton`/`DangerButton` props (incl. `size`) via the ui-kit MCP `getEntityDetails`
- [x] 1.2 Rework `Common/RemoveButton/RemoveButton.tsx` into the two variants (no `label`: borderless ghost icon with red trash; `label`: bordered danger button with `iconBefore`), with props in `Common/RemoveButton/models.ts`
- [x] 1.3 Rewrite `Common/RemoveButton/RemoveButton.spec.tsx` for both variants (role/name, no outline appearance without label, disabled, `className`/`size` passthrough)
- [x] 1.4 Add the reuse rule to `.claude/rules/components.md` §5 and run `npm run sync:agent-mirrors` then `npm run validate:agent-docs`

## 2. Toast wrapping (#5602)

- [x] 2.1 Add `min-w-0 break-words` to the description container in `Notification/Notification.tsx`
- [x] 2.2 Update `Notification/tests/Notification.spec.tsx` to assert the wrapping classes on description and Request ID

## 3. Migrate Analytics hand-rolled icon deletes

- [x] 3.1 Replace the `GhostIconButton` + `IconTrashX` buttons with `RemoveButton` in `Analytics/Pipelines/{Aggregate,Enrich,Filter}` editors (`GroupKeysEditor`, `MeasuresEditor`, `OrderByEditor`, `OutputsEditor`, `TransformParamsEditor`, `VariablesEditor`, `FilterConditionRow`)
- [x] 3.2 Do the same in `Analytics/QueryBuilder` (`ChipRow`, `FilterGroup`, `AggregateForm`), keeping `ColumnRowsEditor` as is
- [x] 3.3 Fix affected specs under `Analytics/` and run them

## 4. Migrate remaining hand-rolled icon deletes

- [x] 4.1 Replace hand-rolled trash buttons in `SubjectRulesEditor`, `EnrichmentRoutes`, `ResourceMultiAuth` and the per-file remove in `Common/FileUploadField`
- [x] 4.2 Move `AppRunnersResource` clear action to `GhostIconButton` + `IconX` (Clear), and drop the redundant `aria-label` on `InterfaceRow`
- [x] 4.3 Fix affected specs (`AppRunnersResource`, `Variable`, `MetricControl`, `FileUploadField`, …) and run them

## 5. Labelled delete buttons

- [x] 5.1 Replace the bordered `DangerButton` deletes with `RemoveButton label` in the entity header wrappers (`Asset`, `Containers`, `Conversation`, `Images`, `Publications`, `Simple`, `Skill`), `PromptDetails`, `AddNewTool`, `Datasets/TestCases/Header`, `UndeclaredPropertiesBanner`
- [x] 5.2 Give `MetricCard` Delete, the saved-query Delete in `QueryBuilder` and Delete all in `FileUploadField` the border through `RemoveButton label`
- [x] 5.3 Fix affected specs and run them

## 6. Quality checks

- [ ] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix any failures
