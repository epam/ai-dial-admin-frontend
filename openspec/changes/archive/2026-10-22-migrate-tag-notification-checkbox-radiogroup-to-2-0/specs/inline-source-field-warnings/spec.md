## MODIFIED Requirements

### Requirement: Top banners remain unchanged

The existing top-of-view banners SHALL NOT be modified by this change:

- The `ContainerStatusBanner` (placed below tabs on Models / Applications / Toolsets / Interceptors detail views) keeps its current placement, copy, button, and trigger conditions.
- The image-not-installed `Notification` in `components/Containers/View/TabsContent.tsx` keeps its current placement, two-variant copy (`ImageNotInstalledWarning` / `ImageBuildFailedWarning`), and `Install image` button.

#### Scenario: ContainerStatusBanner is untouched

- **WHEN** the ContainerStatusBanner component source is read after this change
- **THEN** the trigger condition, the `Notification` props, the i18n keys, and the placement in the four entity Views SHALL be identical to their pre-change state

#### Scenario: Image not installed banner is untouched

- **WHEN** `Containers/View/TabsContent.tsx` is read after this change
- **THEN** the `Notification` block at the top of the Properties tab SHALL render with the same structure, copy, and `Install image` button as before

