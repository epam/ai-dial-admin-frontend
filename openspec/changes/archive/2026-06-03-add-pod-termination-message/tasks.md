## 1. Model & i18n

- [x] 1.1 Add `lastTerminationMessage?: string` to the `Pod` interface in `apps/ai-dial-admin/src/models/deployments/containers.ts`
- [x] 1.2 Add `TerminationMessage = 'EntityFields.TerminationMessage'` to `EntityFieldsI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`
- [x] 1.3 Add `TerminationMessage: 'Termination message'` to the `EntityFields` block in `apps/ai-dial-admin/src/locales/en.ts`

## 2. Header rendering

- [x] 2.1 In `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/PodView.tsx`, render a `LabelledText` for the termination message inside the existing `restartCount > 0` block, guarded by `{!!podData?.lastTerminationMessage && ...}`, label `t(EntityFieldsI18nKey.TerminationMessage)`, text `podData.lastTerminationMessage`
- [x] 2.2 Place the message on its own line below the Restarts / Last restarted at / Last reason row, with a width constraint and wrap/truncate so long messages don't break the header layout

## 3. Verification

- [x] 3.1 Add/extend `PodView` tests covering: message present (renders "Termination message"), message absent/empty (no label rendered)
- [x] 3.2 Run `npm run lint` and `npx vitest run` (from `apps/ai-dial-admin/`) for the touched files; verify in the running app that a crash-looped pod shows the termination message in the header
