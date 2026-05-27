# deployment-banner Specification

## Purpose
TBD - created by archiving change unify-tab-banners. Update Purpose after archive.
## Requirements
### Requirement: Configurable EntityBanner component lives under Deployments/Common

A reusable banner component SHALL live at `components/Deployments/Common/EntityBanner/EntityBanner.tsx`. It SHALL be the only place in the codebase that constructs the `DialNotification` markup used by deployment-related warning banners (`ContainerStatusBanner` and `ImageStatusBanner` SHALL delegate rendering to it). The component's props interface SHALL be named `Props` (per project convention).

#### Scenario: Component file exists at the expected path

- **WHEN** the project is searched for `EntityBanner`
- **THEN** exactly one component file SHALL exist at `apps/ai-dial-admin/src/components/Deployments/Common/EntityBanner/EntityBanner.tsx`

#### Scenario: ContainerStatusBanner delegates rendering to EntityBanner

- **WHEN** `ContainerStatusBanner.tsx` is read
- **THEN** it SHALL import and render `<EntityBanner>` from the new path
- **AND** SHALL NOT render `DialNotification` directly

#### Scenario: ImageStatusBanner delegates rendering to EntityBanner

- **WHEN** `ImageStatusBanner.tsx` is read
- **THEN** it SHALL import and render `<EntityBanner>` from the new path
- **AND** SHALL NOT render `DialNotification` directly

### Requirement: EntityBanner accepts variant, title, message, className, and CTA children

`EntityBanner` SHALL accept the following props:
- `variant?: NotificationVariant` — defaults to `NotificationVariant.Warning` when omitted.
- `title?: ReactNode` — optional inline semibold prefix rendered before the message text. Omitted when not provided.
- `message: ReactNode` — required body content. May be a plain string or rich React content.
- `className?: string` — forwarded to the underlying `DialNotification` for caller-controlled spacing.
- `children?: ReactNode` — optional CTA slot (typically a `DialNeutralButton`) passed through as `DialNotification` children.

The component SHALL render `DialNotification` with `variant={variant ?? NotificationVariant.Warning}`, `className={className}`, a `message` prop containing a `<span className="small">` wrapping the optional bold title (`<span className="small-text-semi">{title}</span>` when title is truthy) followed by `{message}`, and `children` passed through unchanged.

#### Scenario: Default variant is Warning

- **WHEN** `<EntityBanner message="hello" />` is rendered without `variant`
- **THEN** the underlying `DialNotification` SHALL receive `variant={NotificationVariant.Warning}`

#### Scenario: Title is rendered as semibold prefix

- **WHEN** `<EntityBanner title="Container stopped" message="Description text" />` is rendered
- **THEN** the rendered alert message SHALL contain a `<span class="small-text-semi">Container stopped</span>` followed by `Description text`

#### Scenario: Title is omitted when not provided

- **WHEN** `<EntityBanner message="Description only" />` is rendered without `title`
- **THEN** the rendered alert message SHALL NOT contain any `small-text-semi` element

#### Scenario: CTA children are rendered inside DialNotification

- **WHEN** `<EntityBanner message="..."><DialNeutralButton label="Go" /></EntityBanner>` is rendered
- **THEN** the `DialNeutralButton` SHALL appear as a child of the underlying `DialNotification`

#### Scenario: className is forwarded to DialNotification

- **WHEN** `<EntityBanner message="..." className="mb-4" />` is rendered
- **THEN** the underlying `DialNotification` SHALL receive `className="mb-4"`

#### Scenario: Custom variant is forwarded

- **WHEN** `<EntityBanner variant={NotificationVariant.Error} message="..." />` is rendered
- **THEN** the underlying `DialNotification` SHALL receive `variant={NotificationVariant.Error}`

### Requirement: EntityBanner does not couple to data-fetching or business logic

`EntityBanner` SHALL be a presentational component only. It SHALL NOT perform data fetching, read from React contexts, branch on entity types, or contain conditional render logic that depends on application state. All such logic SHALL live in the calling wrapper components (e.g. `ContainerStatusBanner`, `ImageStatusBanner`).

#### Scenario: No imports from server actions, contexts, or hooks tied to app state

- **WHEN** `EntityBanner.tsx` is read
- **THEN** it SHALL NOT import from `@/src/app/actions/*`, `@/src/context/*`, or `@/src/hooks/*`
- **AND** SHALL NOT call `useEffect` for data fetching

