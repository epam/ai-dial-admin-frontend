## 1. Server action

- [x] 1.1 In `apps/ai-dial-admin/src/app/[lang]/platform-keys/actions.ts`, change `toKeyPayload`
  to a single-parameter function including `key` via a null-safe spread
  (`...(keyValue != null && { key: keyValue })`), per `design.md` decision 1; delete the
  `options` parameter and the `{ includeKey: true }` flags from `createKey`/`rotateKey`
- [x] 1.2 Rewrite the `toKeyPayload` doc comment to the include-when-present contract, stating the
  null normalization explicitly

## 2. Tests

- [x] 2.1 In `apps/ai-dial-admin/src/app/[lang]/platform-keys/actions.spec.ts`, flip the two
  update-omits-key tests: update with a `key` value asserts the payload carries it; update without
  (and with `key: null`) asserts the payload has no `key` property
- [x] 2.2 Verify create/rotate tests still pass unchanged
  (`npx vitest run src/app/[lang]/platform-keys/actions.spec.ts` from `apps/ai-dial-admin/`)

## 3. Quality gates

- [x] 3.1 Run `npm run lint` and `npm run typecheck` from repo root; fix anything this change
  introduced
- [x] 3.2 Run the full `npm run test` coverage gate from `apps/ai-dial-admin/`; no coverage
  regression

No browser-verification task: the user opted for unit tests only — the payload contract is fully
covered by `actions.spec.ts`, and the UI surface (editor toggle, notification) is unchanged by
this change.
