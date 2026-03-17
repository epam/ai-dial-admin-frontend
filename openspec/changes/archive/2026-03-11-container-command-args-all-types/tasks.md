# Tasks

- [x] **Remove HUGGINGFACE guard on ContainerConfiguration** — In `apps/ai-dial-admin/src/components/Containers/Fields/ContainerFields.tsx`, remove the `container.source?.$type === CONTAINER_SOURCE_TYPE.HUGGINGFACE &&` condition wrapping `<ContainerConfiguration>` (lines 40-42). Keep the component inside the `!isModal` block as-is.
- [x] **Run code quality checks** — Run linting, formatting, and tests to verify no regressions.
