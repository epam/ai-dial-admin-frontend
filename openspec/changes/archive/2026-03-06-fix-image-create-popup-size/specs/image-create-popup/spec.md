## MODIFIED Requirements

### Requirement: Image creation popup size

The image creation popup SHALL use `PopupSize.Md` to match the amount of content displayed in modal mode.

#### Scenario: Popup renders at medium size
- **WHEN** user opens the image creation popup
- **THEN** the popup SHALL render with `PopupSize.Md`, consistent with other similar deployment modals (`ImageAdd`, `ContainerDuplicate`, `ImageDuplicate`)
