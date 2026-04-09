## 1. Core Implementation

- [x] 1.1 In `src/components/SourceField/Containers/Containers.tsx`: add `currentContainerDisplayName` state. In `fetchContainers` effect, extract the display name from the full API response before filtering to running-only. Use as fallback in `DialInputPopup`'s `selectedValue` prop.

## 2. Tests

- [x] 2.1 Add tests in `src/components/SourceField/Containers/Containers.spec.tsx` covering: (a) stopped container's display name shown in input, (b) running container display name shown in input, (c) empty state when container not returned by API.

## 3. Quality Checks

- [x] 3.1 Run lint, format, and tests — all pass.
