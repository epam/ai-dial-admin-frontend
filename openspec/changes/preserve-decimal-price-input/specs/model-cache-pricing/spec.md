## ADDED Requirements

### Requirement: Model pricing accepts precise non-negative decimal rates

The model pricing block SHALL allow an administrator to enter a non-negative decimal rate with leading or repeated fractional zeroes. While the price field is focused, the field SHALL preserve an in-progress valid decimal representation, including a trailing decimal separator, rather than replacing it with its normalized numeric value. The pricing block SHALL continue to reject negative values and SHALL preserve the existing distinction between an empty rate and an explicit zero rate.

#### Scenario: A precise decimal rate remains editable

- **WHEN** an administrator enters `0.0002` into an empty editable price field
- **THEN** the field retains `0.0002` while being edited and the pricing model receives the corresponding rate value

#### Scenario: A decimal draft retains a trailing separator

- **WHEN** an administrator enters `0.` into an empty editable price field
- **THEN** the field retains the trailing decimal separator so further fractional digits, including zeroes, can be entered

#### Scenario: A negative price is rejected

- **WHEN** an administrator attempts to enter a negative value into an editable price field
- **THEN** the field does not accept the negative value
