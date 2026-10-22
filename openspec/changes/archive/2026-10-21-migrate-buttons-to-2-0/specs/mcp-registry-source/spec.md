## MODIFIED Requirements

### Requirement: Shared SidePanel chrome component

The FE SHALL expose a reusable `SidePanel` component at `src/components/Common/SidePanel/SidePanel.tsx` that provides the titled closable aside chrome. The component SHALL own only the chrome (outer container, header with label and close button, open-gating, children slot) and SHALL NOT own any data-fetching, loading, empty-state, or i18n logic.

The component SHALL accept the following props:

- `label: ReactNode` — header label text
- `isOpen: boolean` — gate controlling whether the panel is rendered
- `onClose: () => void` — invoked when the close button is clicked
- `children: ReactNode` — body content
- `className?: string` — optional override for the outer container (escape hatch for per-usage tweaks)

The outer container SHALL use the classes `flex flex-col lg:w-[420px] p-4 border border-primary rounded h-full` by default. The header row SHALL render the label as `<span className="dial-tiny-text text-secondary">` followed by a `CloseButton` at its default `ElementSize.Small` (24px).

Both the HuggingFace `ModelDescription` and the new `McpServerDetails` SHALL compose `SidePanel`. `ModelDescription` SHALL be refactored to compose `SidePanel` without regressing its existing fetch/loader/empty behavior.

#### Scenario: Panel is hidden when closed

- **WHEN** `SidePanel` is rendered with `isOpen={false}`
- **THEN** it SHALL render nothing (return `null`)

#### Scenario: Panel renders label and children when open

- **WHEN** `SidePanel` is rendered with `isOpen={true}`, a label, and children
- **THEN** the label SHALL appear in the header row
- **AND** the children SHALL appear in the body
- **AND** a close button SHALL be present in the header

#### Scenario: Close button invokes onClose

- **WHEN** the user clicks the close button
- **THEN** `onClose` SHALL be invoked exactly once
- **AND** `SidePanel` SHALL NOT internally change its `isOpen` state (owned by the parent)

#### Scenario: ModelDescription composition

- **WHEN** the HuggingFace registry modal opens a model description
- **THEN** `ModelDescription` SHALL render a `SidePanel` with `label={t(ContainersI18nKey.ModelDetails)}`
- **AND** the existing markdown/loader/empty behavior SHALL appear inside the `SidePanel` children
- **AND** the close button in `SidePanel` SHALL call `onChangeIsDescriptionShown(false)`
