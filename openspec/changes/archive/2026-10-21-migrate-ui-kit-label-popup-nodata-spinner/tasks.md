## 1. NoDataContent (`DialNoDataContent` → `NoDataContent`, 57 files)

- [x] 1.1 Replace the import and JSX in every app source file under `apps/ai-dial-admin/src` that uses `DialNoDataContent`
- [x] 1.2 Rename `containerClassName` to `className` at its two uses (`Analytics/SessionsTrace/Detail/SessionEventStream.tsx`, `SessionTraceList.tsx`)
- [x] 1.3 Update specs that assert on or mock `DialNoDataContent` (e.g. `Runs/Compare/Summary/tests`, `TestSuites/Metrics/tests`) to the new name

## 2. Label (`DialLabel` → `Label`, 51 files)

- [x] 2.1 Replace the import and JSX in every app source file that uses `DialLabel` (do not touch `DialLabelledText`); leave `htmlFor` exactly as it is
- [x] 2.2 Update specs that mock or assert on `DialLabel` to the new name

## 3. ConfirmationPopup (`DialConfirmationPopup` → `ConfirmationPopup`, 42 files)

- [x] 3.1 Replace the import and JSX in every app source file that uses `DialConfirmationPopup`
- [x] 3.2 In `ActivityAudit/Modals/Confirmation.tsx` and `Deployments/Modals/ContainerNodePoolModal/ContainerNodePoolModal.tsx`, replace `dividers` with `headerDivider` and `footerDivider`
- [x] 3.3 Update specs that mock or assert on `DialConfirmationPopup` to the new name

## 4. Spinner (`DialLoader` → `Spinner`, 127 files)

- [x] 4.1 Replace the import and JSX in every app source file that uses `DialLoader`, pinning props per `design.md`: `<DialLoader />` → `<Spinner size={18} fullWidth />`; `size={N}` sites gain `fullWidth`; sites with `fullWidth={false}` keep it
- [x] 4.2 Drop the loader colour classes that no longer apply (`text-primary` / `text-secondary`) in `Analytics/QueryBuilder/Result/ResultArea.tsx`, `Notification/Notification.tsx`, `Runs/Export/components/Columns.tsx`, `Runs/Export/components/Preview.tsx`, `Runs/Summary/DeploymentExternalLink.tsx`, `TestSuites/Properties/Properties.tsx`; keep any layout classes
- [x] 4.3 In `Common/StatusBadge/StatusBadge.tsx`, drop `iconClassName={textClassName}` and leave the default ring colour (accepted in `design.md`)
- [x] 4.4 Update the 22 specs that mock `DialLoader` by name to mock/assert `Spinner`; the aria-label and role they assert must still match the real `Spinner` output

## 5. Unit tests

- [x] 5.1 Confirm no spec or `test-setup.tsx` still references `DialLoader`, `DialLabel`, `DialConfirmationPopup` or `DialNoDataContent`; no mock may keep standing in for a name the code no longer imports
- [x] 5.2 Add or adjust specs where the pinned `Spinner` props or the changed `ConfirmationPopup` dividers are observable (the two `dividers` sites; a bare-loader site asserting its size), following `.claude/rules/testing.md`

## 6. Quality checks

- [x] 6.1 Run lint, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` (both at zero), then the full `npm run test`; grep the whole of `apps/ai-dial-admin` for the four legacy names and fix anything left
