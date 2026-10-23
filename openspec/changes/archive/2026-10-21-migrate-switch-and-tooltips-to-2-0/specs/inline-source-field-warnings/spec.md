## MODIFIED Requirements

### Requirement: Shared WarningIcon component lives under Common

A shared `<WarningIcon />` component SHALL live at `components/Common/WarningIcon/WarningIcon.tsx`. The component SHALL accept a single optional prop `warningText?: string`. When `warningText` is a non-empty string, the component SHALL render a yellow warning icon (`IconAlertTriangleFilled` from `@tabler/icons-react`) with class `text-warning-icon`, wrapped in a `Tooltip` (placement `TooltipPlacement.Bottom`) whose body is `warningText`. When `warningText` is falsy (undefined, null, or empty string), the component SHALL render the icon hidden (no visual presence) and the tooltip trigger SHALL be hidden.

#### Scenario: Icon renders when warningText is provided

- **WHEN** `<WarningIcon warningText="Container is not running" />` renders
- **THEN** an `IconAlertTriangleFilled` SHALL be visible with `className` containing `text-warning-icon`
- **AND** a `Tooltip` SHALL wrap the icon with placement `bottom`
- **AND** hovering the icon reveals the tooltip with the text "Container is not running"

#### Scenario: Icon hides when warningText is undefined

- **WHEN** `<WarningIcon warningText={undefined} />` renders
- **THEN** the rendered `IconAlertTriangleFilled` SHALL include the class `hidden`
- **AND** the `Tooltip` trigger SHALL also be hidden

#### Scenario: Icon hides when warningText is an empty string

- **WHEN** `<WarningIcon warningText="" />` renders
- **THEN** the icon SHALL be hidden (same behavior as undefined)
