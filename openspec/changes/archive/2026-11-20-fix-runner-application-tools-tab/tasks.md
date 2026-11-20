## 1. Effective application tool discovery

- [x] 1.1 Add a scoped effective-tools operation to `apps/ai-dial-admin/src/server/core/toolset-ops-api.ts` for Core's `/allowed-tools` contract, retaining correct public-resource, platform, and config-application identity encoding without changing existing toolset discovery.
- [x] 1.2 Expose authenticated application discovery actions in `apps/ai-dial-admin/src/app/[lang]/assets-applications/actions.ts` and `apps/ai-dial-admin/src/app/[lang]/applications/actions.ts`, preserving the existing structured success and error responses.

## 2. Runner-backed Tools presentation

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Applications/View/TabsContent.tsx` and shared `Tools` wiring to recognize schema-backed application sources independently of loaded runner details, including public, platform, and config application models.
- [x] 2.2 Update `apps/ai-dial-admin/src/components/Tools/Tools.tsx` and its helpers to use effective discovery for this mode, display returned definitions with search, hide selection/filter controls and their management-only warnings, and never mutate the application from the tab.
- [x] 2.3 Preserve the existing application Try Out path and permission checks, and make saved-data semantics clear when runner or properties have unsaved changes; do not change direct-MCP application, toolset, or container workflows.

## 3. Automated unit tests

- [x] 3.1 Add tests for the new Core operation and actions: public, platform, and config application ID mapping; returned complete effective definitions; and error propagation. Keep existing discovery tests passing.
- [x] 3.2 Extend `apps/ai-dial-admin/src/components/Tools/tests/Tools.spec.tsx` and related utility/view tests for empty and restricted effective results, search, loading/failure, unresolved runners, no entity mutation, and saved-versus-unsaved behavior.
- [x] 3.3 Add regression tests for application Try Out and its existing permission behavior, direct-MCP application controls, toolset management, and container routing; cover all new and updated code.

## 4. Search feedback and component refactor

- [x] 4.1 Show an accessible loading indicator for pending runner-backed searches while preserving input focus, result state, and the 300 ms debounce.
- [x] 4.2 Extract shared discovery and display state into focused hooks and split toolbar/results rendering into components without changing non-runner application, toolset, or container behavior.
- [x] 4.3 Add focused tests for pending search timing, cancellation, focus, retained results, and refactored discovery and management workflows.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`; resolve failures or report any environment blockers.
