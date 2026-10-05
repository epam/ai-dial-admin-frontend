## ADDED Requirements

### Requirement: Conditional-rate field values remain removable at every length

When a user commits a standard usage field or a free-text JSONPath as the Field value of a conditional cache-rate test, the selected value SHALL remain within the field control and its clear control SHALL stay visible, keyboard-accessible, and functional regardless of the selected value's length. When the displayed tag text is truncated, the complete selected value SHALL remain accessible through an ellipsis tooltip.

#### Scenario: A long JSONPath field value can be cleared

- **WHEN** a user commits a free-text JSONPath longer than the available Field control width in a conditional cache-rate test
- **THEN** the selected tag's clear control remains visible and accessible, and activating it clears the Field value

#### Scenario: A truncated field value remains available in full

- **WHEN** a committed conditional-rate Field value is longer than the available Field control width
- **THEN** the field control presents the full selected value through an ellipsis tooltip
