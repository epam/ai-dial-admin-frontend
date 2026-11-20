## ADDED Requirements

### Requirement: Properties exposes the model provider and lifecycle dates
The model asset's Properties tab SHALL expose DIAL Core's optional, informational `provider`, `deprecationDate` and `endOfService` fields, with `provider` after the intro control and the two date fields on one row below it. `provider` SHALL be a free-text input. `deprecationDate` and `endOfService` SHALL be date fields whose stored value is the `YYYY-MM-DD` string Core holds. The fields SHALL be read and written in camelCase, exactly as the model resource carries them. The tab SHALL NOT validate them, warn about a past date, or relate one date to the other, because Core treats them as informational.

#### Scenario: Provider is editable
- **WHEN** a user types a value into the Provider input
- **THEN** the model resource's `provider` holds that value and saving persists it

#### Scenario: A date is picked and stored as a plain date string
- **WHEN** a user picks 30 June 2027 in the Deprecation date field
- **THEN** the model resource's `deprecationDate` is `2027-06-30`, regardless of the viewer's timezone

#### Scenario: A stored date is shown in its field
- **WHEN** a model resource with `endOfService` `2027-12-31` is opened
- **THEN** the End of service field shows 31 December 2027

#### Scenario: A date can be cleared
- **WHEN** a date field holds a date and the user activates its clear button
- **THEN** the field shows its placeholder, the clear button is no longer offered, and the saved resource omits that date

#### Scenario: No clear button on an empty date field
- **WHEN** a date field has no value
- **THEN** no clear button is offered for it

#### Scenario: A malformed stored date is preserved
- **WHEN** a model resource whose `deprecationDate` is not a `YYYY-MM-DD` date is opened and saved without touching that field
- **THEN** the field shows its placeholder and the stored value is written back unchanged

#### Scenario: An untouched model gains no fields
- **WHEN** a model with none of the three fields is opened and saved without editing them
- **THEN** the written resource contains none of `provider`, `deprecationDate` or `endOfService`

#### Scenario: A read-only admin cannot edit them
- **WHEN** a read-only admin opens a model asset's Properties tab
- **THEN** the Provider, Deprecation date and End of service fields and their clear buttons are disabled

#### Scenario: The listing and alias views are unchanged
- **WHEN** the platform models list or an alias's Target tab is shown
- **THEN** neither displays provider or lifecycle dates, because Core does not return them there
