## Context

NIM was one of two Model Serving engines next to HF (`inference`). Its footprints: a container type, an NGC Registry source with an `imageRef` and a gRPC port, a feature flag, audit and import/export resource types, and a `v1` completion-endpoint prefix. Product will not support it any further.

## Decisions

- **Remove everything, no compatibility shim.** Keeping the enum members for "old data" would keep the dead surface alive. The cost is accepted: old NIM entries are not recognized.
- **Hide NIM audit rows, do not relabel them.** Without the enum member a `NimDeployment` row falls through to the default label and route, which shows a broken entry. The list drops those rows client-side in `List.tsx`, before the row buffer (`utils/audit/hidden-resource-types.ts`; the literal lives there because the enum member is gone). The datasource already fills the buffer page by page until it has enough shown rows, as it does for the table-scope narrowing, so a page of hidden rows costs one more request, not a short page. Rejected: a server-side `resourceType ne` filter, because it relies on backend support for that operator that was not verified.
- **`getEndpointPrefix()` stays a function.** It now returns the constant `openai/v1`; the call sites and mocks stay stable.
- **Specs edited in place.** Removal deltas were folded directly into the consolidated specs in the same change, so this change carries no `specs/` delta and archiving it syncs nothing.

## Risks

- Models whose stored `completionEndpointPath` starts with `v1/` keep that value; only template creation and container selection change.
- Hidden NIM audit rows stay in the backend; they are filtered, not deleted.
