## MODIFIED Requirements

### Requirement: Container source field shows warning icon when saved container is not running

The Container source field rendered by `components/SourceField/Containers/Containers.tsx` SHALL render `<WarningIcon warningText={...} />` inside the `InputPopup`'s `iconBefore` slot whenever the saved container (the one referenced by `entity.source.containerId`) is present in the fetched container list and has a `status` other than `CONTAINER_STATUS.RUNNING`. The tooltip text SHALL be sourced from `t(ContainersI18nKey.ContainerNotRunningTooltip)` ("Container is not running"). This decoration SHALL apply only to the non-modal popup branch — the modal create-flow branch (which uses `Select`) is excluded.

#### Scenario: Stopped container shows the icon

- **WHEN** the field renders for an entity whose saved container has `status === 'stopped'`
- **THEN** `InputPopup` SHALL receive an `iconBefore` containing a `WarningIcon` whose `warningText` resolves to `t(ContainersI18nKey.ContainerNotRunningTooltip)`

#### Scenario: Pending, crashed, stopping, not_deployed all show the icon

- **WHEN** the saved container's status is any of `pending`, `crashed`, `stopping`, `not_deployed`
- **THEN** the icon SHALL render

#### Scenario: Running container hides the icon

- **WHEN** the saved container's status is `running`
- **THEN** the `iconBefore` SHALL pass `warningText={undefined}` (icon hidden)

#### Scenario: No saved container hides the icon

- **WHEN** `entity.source?.containerId` is empty or the referenced container is not in the fetched list
- **THEN** the icon SHALL be hidden

#### Scenario: Modal create-flow does not render the icon

- **WHEN** the component renders with `isModal === true`
- **THEN** the modal branch SHALL render `Select` without any `WarningIcon` (the modal flow only allows selecting running containers, so the warning state is unreachable there)
