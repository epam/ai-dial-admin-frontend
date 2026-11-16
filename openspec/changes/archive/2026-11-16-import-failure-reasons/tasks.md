## 1. Carry Core's reason on import results

- [x] 1.1 Add `error?: string` to `ImportResult` in `apps/ai-dial-admin/src/models/import.ts`
- [x] 1.2 In `importAssetsExport` (`apps/ai-dial-admin/src/server/assets/exim.ts`), set `error` from `result.errorMessage` on the failed-`PUT` branch; leave the invalid-id branch without a reason

## 2. Group failures by reason in the notification

- [x] 2.1 Add a pure helper in `apps/ai-dial-admin/src/components/Assets/utils.ts` that takes the failed results and `t` and returns the description: reason headers ending in `:` in first-seen order, one-space-indented paths one per line, a final no-reason group under the `ImportErrorDescription` header (paths not deduplicated, reasons collapsed)
- [x] 2.2 Replace the four `failedMessages.join(', ')` blocks in `getImportNotificationContent` (Files, Prompts, Applications, Toolsets) with the helper; keep `failedItems` for the title count and drop `failedMessages`
- [x] 2.3 Change `Import.ErrorDescription` in `apps/ai-dial-admin/src/locales/en.ts` to the bare header `Error occured while importing` (remove `{list}`)

## 3. Tests

- [x] 3.1 Update `apps/ai-dial-admin/src/components/Assets/tests/utils.spec.ts`: rewrite the cases that assert the `, ` join and the dedup (around the `ImportErrorDescription` mock and the duplicate-entry case); add cases for several reasons, one shared reason, no-reason only, mixed with the no-reason group last, and no failures
- [x] 3.2 Add a case under `apps/ai-dial-admin/src/server/assets/tests` that a rejected `PUT` yields a `FAILED` result carrying Core's `errorMessage`, and an invalid id yields one with no `error`

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npx vitest run` on the touched specs, then the full `npm run test` as the final gate
