## ADDED Requirements

### Requirement: Bound metric list cards
Each bound metric on the Metrics tab SHALL render as a card with: avatar and metric name; Delete and Edit actions; optional expandable description when present; a Condition row (saved condition, or the Always-run label when empty); Configuration tags from `configBindings` when present; Outputs tags from `outputSchema.properties` keys when present; Inputs tags from `inputBindings` when present. Empty Configuration, Outputs, or Inputs rows SHALL be omitted. Binding tags SHALL show `{property}: {display value}`; long or multi-line display values SHALL use a full-width multi-line tag.

#### Scenario: Card shows condition and bindings
- **WHEN** the Metrics tab has loaded a metric with a description, condition, config bindings, input bindings, and an `outputSchema` with properties
- **THEN** the metric card shows the description (with Show more when clamped), the Condition value, Configuration tags, Outputs tags named after each output property, and Inputs tags

#### Scenario: Empty outputs and bindings omitted
- **WHEN** a metric has no `configBindings`, no `inputBindings`, and no `outputSchema.properties`
- **THEN** the card still shows Condition (Always run when unset) and does not render Configuration, Outputs, or Inputs rows

#### Scenario: Outputs use aggregated schema without extra fetch
- **WHEN** the Metrics tab has loaded via the aggregated fetch and a metric's `outputSchema` lists properties
- **THEN** the Outputs row lists those property names as tags without issuing an additional request for the schema
