# Tasks

## 1. Creation validation and refactor

- [x] 1.1 Extract creation calculations and step enum from `apps/ai-dial-admin/src/components/Assets/Entities/Apps/CreateApplication.tsx` into feature-local utils and constants; retain current defaults, source-mode behavior and shared validation gate; verify the existing modal tests pass.
- [x] 1.2 Accept valid chat or MCP endpoints in the create-only source predicate, with a narrow type for the MCP resource field; verify chat-only, MCP-only, absent and invalid endpoints with focused utility tests.
- [x] 1.3 Add focused utility and component tests for all new and updated logic, unchanged Interfaces/runner/Code App behavior, invalid field-level validation, source switching, and the MCP-only submitted payload; run the affected Vitest files.
- [x] 1.4 Add an integration test using the real source editor and validation provider to verify MCP-only Create enablement and invalid or empty active endpoint blocking; run the integration test.

## 2. Final quality checks

- [x] 2.1 Run lint, spec lint, format check, both typechecks, and the full test/coverage gate; resolve or report failures and validate the OpenSpec change.

## Workflow follow-up

- Archive the completed change and verify the application-source delta is incorporated in the consolidated specification.
