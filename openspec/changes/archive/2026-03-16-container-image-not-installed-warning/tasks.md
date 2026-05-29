## Tasks

- [x] 1. Add utility for checking image installation status — Create `isImageNotInstalled(image?: Image)` in `src/utils/deployments/images.tsx`
- [x] 2. Add i18n keys for image warning messages — `ImageNotInstalledWarning`, `ImageBuildFailedWarning`, `InstallImage` in containers i18n
- [x] 3. Add `warning` parameter to `propertiesTab()` — Extend in `src/utils/tabs/utils.ts`, same pattern as `firewallTab()`
- [x] 4. Pass `imageNotInstalled` flag to Properties tab in `ContainerView.tsx` — Compute from `image?.buildStatus`
- [x] 5. Add image warning banner to `TabsContent.tsx` — `DialNotification` + `DialNeutralButton` + `ImageInstall` modal + navigation
- [x] 6. Disable Run button when image not installed — Pass `image` to `ContainersButtonsWrapper`, disable Run
- [x] 7. Unit tests — utility, banner rendering, Run button disabled state
