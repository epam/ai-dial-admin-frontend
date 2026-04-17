## 1. Helper

- [x] 1.1 In `apps/ai-dial-admin/src/utils/models/model-endpoint.ts`, add `getEndpointPrefix(containerType?: CONTAINER_TYPE): string` returning `'v1'` for `CONTAINER_TYPE.NIM` and `'openai/v1'` otherwise. Import `CONTAINER_TYPE` from `@/src/types/deployments/containers`.

## 2. Call sites

- [x] 2.1 In `apps/ai-dial-admin/src/utils/deployments/entity.ts`, replace the hardcoded `` `openai/v1${getEndpointPostfix(...)}` `` at line 119 with `` `${getEndpointPrefix(container.$type)}${getEndpointPostfix((template as DialModel).type)}` ``. Import `getEndpointPrefix` from `@/src/utils/models/model-endpoint`.
- [x] 2.2 In `apps/ai-dial-admin/src/components/SourceField/Containers/Containers.tsx`, inside `onSelect` (around line 91), look up the selected container via `const selected = containers.find(c => c.name === id);` and replace the hardcoded `openai/v1` with `` `${getEndpointPrefix(selected?.$type)}${getEndpointPostfix((entity as DialModel).type)}` ``. Ensure `containers` is included in the `useCallback` dependency list.

## 3. Tests

- [x] 3.1 Update `apps/ai-dial-admin/src/utils/deployments/tests/entity.spec.ts`: replace the existing "configures model specific fields for ModelServings" case with two cases — NIM container produces `v1/chat` (given the current postfix mock `/chat`), and HF/inference container produces `openai/v1/chat`. Use `CONTAINER_TYPE` values from `@/src/types/deployments/containers`.
- [x] 3.2 Update `apps/ai-dial-admin/src/components/SourceField/Containers/Containers.spec.tsx` to add an `onSelect` assertion per container type: render `Containers` with `view={ApplicationRoute.Models}`, trigger selection of a `CONTAINER_TYPE.NIM` container and assert the `onChange` payload's `source.completionEndpointPath` starts with `v1/`; repeat for a non-NIM container and assert it starts with `openai/v1/`. Reuse existing test-setup mocks — do not introduce new ones.

## 4. Quality gate

- [x] 4.1 From `apps/ai-dial-admin/`, run `npx vitest run src/utils/deployments/tests/entity.spec.ts src/components/SourceField/Containers/Containers.spec.tsx` and confirm green.
- [x] 4.2 From repo root, run `npm run lint` and `npm run format` and resolve any issues before commit.
- [x] 4.3 From repo root, run `npm run test` to confirm the full suite passes ahead of push.
