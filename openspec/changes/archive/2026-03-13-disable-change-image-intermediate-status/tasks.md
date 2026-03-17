## 1. Implementation

- [x] 1.1 Import `isEditDisabled` from `@/src/utils/deployments/containers` in `TabsContent.tsx`
- [x] 1.2 Compute `editDisabled` using `useMemo` with `isEditDisabled(selectedContainer)`
- [x] 1.3 Replace `DialLabelledText` text+postfix pattern with `DialGhostButton` child: `label` for image name+version, `iconAfter` for OpenPopup, `disabled={editDisabled}`, `onClick={handleModalOpen}`
- [x] 1.4 Remove callback guard from `handleModalOpen` (no longer needed with native button disabled)

## 2. Testing

- [x] 2.1 Add RUNNING and NOT_DEPLOYED cases to `isEditDisabled` tests in `containers.spec.ts`

## 3. Quality Checks

- [x] 3.1 Run lint, format, and test suite to verify no regressions
