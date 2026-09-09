## 1. Send the transcript alone

- [x] 1.1 In `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Ai/AiPanel.tsx`, call
  `generateQuery(nextMessages)` instead of prepending a schema message, drop the
  `buildSchemaSystemMessage` import, drop the `useQueryBuilder()` call and its `state` destructuring
  (design D2), and drop the comment block that explains the per-request schema message.
- [x] 1.2 Delete `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/ai-context.ts` and
  `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/tests/ai-context.spec.ts`.
- [x] 1.3 Confirm nothing else imports `ai-context` or `buildSchemaSystemMessage`, and that
  `QueryAssistantRole.System` in `src/models/analytics/query-assistant.ts` stays — it models the
  chat-completions role set the `QueryAssistantMessage.role` field is typed by, so it stays even with no
  remaining producer in this app.

## 2. Tests

- [x] 2.1 In `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Ai/tests/AiPanel.spec.tsx`, replace
  the schema-message assertions (the system-role first message, the "keeps the schema message out of the
  visible transcript" case, and the empty-`fields` case) with: the messages passed to `generateQuery` are
  exactly the visible transcript in order, no message carries the `system` role, and a second turn sends
  both prior turns plus the new one. Drop the now-unused builder-state fields fixture if nothing else uses
  it.
- [x] 2.2 Run `npx vitest run src/components/Analytics/QueryBuilder --coverage=false` from
  `apps/ai-dial-admin/` and fix fallout in sibling QueryBuilder specs.

## 3. Quality checks

- [x] 3.1 Run `npm run lint` and `npm run test` from the repo root; both clean.

No browser-verification task: the change's browser-observable scenarios all depend on a working assistant
deployment, which currently fails a request when its model calls one of its own tools by an unprefixed name
(proposal.md — Non-goals). A gate run would report that upstream failure rather than this change. The
message composition the change actually alters is fully covered by task 2.1, which asserts the exact
`generateQuery` argument.
