# deployments-compute-section Specification

## Purpose

Group the container's compute-related fields (node pool selection and resource requests / limits) under a single "Compute" accordion on the container detail form, with a single section-level error indicator covering the resource validation fields, so operators see all scheduling and sizing decisions in one place.

## Requirements

### Requirement: Compute accordion replaces the inline Resources panel

The container detail form (`Containers/Fields/ContainerFields.tsx`) SHALL render exactly one `ContainerCompute` accordion in the position previously occupied by the standalone `ContainerResources`. The accordion title SHALL be `EntityFieldsI18nKey.Compute`. The accordion body SHALL contain `ContainerNodePool` followed by `ContainerResources`, in that order, separated by vertical spacing consistent with other multi-field accordions (`gap-y-8`).

#### Scenario: Accordion title

- **WHEN** the container detail form is rendered
- **THEN** an accordion with title `EntityFieldsI18nKey.Compute` SHALL be present

#### Scenario: Child order is NodePool then Resources

- **WHEN** the Compute accordion is rendered
- **THEN** the `ContainerNodePool` element SHALL appear in the DOM before the `ContainerResources` element within the accordion body

#### Scenario: Only one Resources mount

- **WHEN** the container detail form is rendered
- **THEN** `ContainerResources` SHALL be mounted exactly once, as a child of `ContainerCompute`, and SHALL NOT also appear as a standalone sibling section

### Requirement: Shared error indicator for resource validation

The accordion SHALL render its `errorIndicator` when `SaveValidationContext` reports `isValid === false` and at least one of `gpuRequest`, `cpuRequest`, `cpuLimit`, `memoryRequest`, `memoryLimit` is present in `errorFields`. The indicator SHALL clear when `isValid === true`, regardless of stale entries in `errorFields`. Node-pool selection state SHALL NOT contribute to the error indicator — pool choice has no client-side required-field validation, and dangling references surface inline in the selector display instead.

#### Scenario: Indicator lights up for a tracked field

- **WHEN** `useSaveValidationContext()` returns `{ isValid: false, errorFields: { cpuRequest: false } }`
- **THEN** the accordion SHALL render the error indicator

#### Scenario: Indicator clears on valid state

- **WHEN** `useSaveValidationContext()` returns `{ isValid: true, errorFields: { cpuRequest: false } }`
- **THEN** the accordion SHALL NOT render the error indicator

#### Scenario: Indicator ignores unrelated error keys

- **WHEN** `useSaveValidationContext()` returns `{ isValid: false, errorFields: { somethingElse: false } }` (no resource keys)
- **THEN** the accordion SHALL NOT render the error indicator

#### Scenario: Indicator ignores node-pool selection state

- **WHEN** the container has a dangling `nodePoolId` (no matching live pool and no cached name) and all resource fields validate
- **THEN** the accordion SHALL NOT render the error indicator (the "Unknown node pool" warning inside the selector field is the only surfacing of this state)

### Requirement: Disabled and route forwarding

`ContainerCompute` SHALL forward its `disabled` prop to both `ContainerNodePool` and `ContainerResources`. When `disabled` is omitted, each child SHALL fall back to its own edit-disabled determination (e.g. `isEditDisabled(container)` in `ContainerNodePool`). `ContainerCompute` SHALL forward the `route` prop to `ContainerResources` so the existing model-servings-only GPU input continues to render only on `ApplicationRoute.ModelServings`.

#### Scenario: `disabled` reaches both children

- **WHEN** the parent renders `<ContainerCompute disabled />`
- **THEN** both `ContainerNodePool` and `ContainerResources` SHALL receive `disabled === true`

#### Scenario: `route` reaches Resources

- **WHEN** the parent renders `<ContainerCompute route={ApplicationRoute.ModelServings} />`
- **THEN** `ContainerResources` SHALL receive `route === ApplicationRoute.ModelServings`
