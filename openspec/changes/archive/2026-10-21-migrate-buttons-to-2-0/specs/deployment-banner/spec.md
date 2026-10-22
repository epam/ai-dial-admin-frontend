## MODIFIED Requirements

### Requirement: EntityBanner accepts variant, title, message, className, and CTA children

`EntityBanner` SHALL accept the following props:
- `variant?: NotificationVariant` — defaults to `NotificationVariant.Warning` when omitted.
- `title?: ReactNode` — optional inline semibold prefix rendered before the message text. Omitted when not provided.
- `message: ReactNode` — required body content. May be a plain string or rich React content.
- `className?: string` — forwarded to the underlying `DialNotification` for caller-controlled spacing.
- `children?: ReactNode` — optional CTA slot (typically a `OutlinedButton`) passed through as `DialNotification` children.

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

- **WHEN** `<EntityBanner message="..."><OutlinedButton label="Go" /></EntityBanner>` is rendered
- **THEN** the `OutlinedButton` SHALL appear as a child of the underlying `DialNotification`

#### Scenario: className is forwarded to DialNotification

- **WHEN** `<EntityBanner message="..." className="mb-4" />` is rendered
- **THEN** the underlying `DialNotification` SHALL receive `className="mb-4"`

#### Scenario: Custom variant is forwarded

- **WHEN** `<EntityBanner variant={NotificationVariant.Error} message="..." />` is rendered
- **THEN** the underlying `DialNotification` SHALL receive `variant={NotificationVariant.Error}`
