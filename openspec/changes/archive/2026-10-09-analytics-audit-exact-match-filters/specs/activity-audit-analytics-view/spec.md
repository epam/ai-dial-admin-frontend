## ADDED Requirements

### Requirement: The Analytics list filters enum and identifier columns by exact match

The `Analytics` view's **Activity type**, **Resource type**, **Activity ID** and **Parent ID** column filters
SHALL offer only the *Equals* and *Does not equal* operators, and *Equals* SHALL be the default, because the
analytics backend accepts a substring (`co`) match only on string columns and rejects it on an enum or a UUID
column. A value typed into one of these columns' floating filter SHALL therefore be sent with the `eq` operator.
The other columns of the list, including **Resource identifier**, SHALL keep their text operators.

Under *Equals* or *Does not equal*, the **Resource type** filter SHALL resolve a typed label that equals, ignoring
case, the display label of exactly one resource type to that type, and SHALL send any other typed value
unchanged. A label shared by several resource types is sent unchanged. This resolution is the same in the `Config`
and `Deployments` views, which keep the operators they offer today.

#### Scenario: Activity type filters by the typed value

- **WHEN** the reader types `update` into the Analytics list's Activity type floating filter
- **THEN** the request carries the filter `{ column: "activityType", operator: "eq", value: "update" }`

#### Scenario: The enum and identifier columns offer no substring operator

- **WHEN** the reader opens the filter menu of the Activity type, Resource type, Activity ID or Parent ID column
- **THEN** the operator choices are Equals and Does not equal, with Equals selected
- **AND** the Resource identifier column still offers Contains and Does not contain

#### Scenario: A resource-type label resolves to its type

- **WHEN** the reader types `table` into the Resource type filter and `Table` is the only type with that label
- **THEN** the request carries `{ column: "resourceType", operator: "eq", value: "Table" }`
- **AND** typing `table column` carries the value for the table-column type

#### Scenario: Config and Deployments keep their operators

- **WHEN** the Config or Deployments view is shown
- **THEN** its Activity type, Resource type and ID columns offer the same operators as before this change

#### Scenario: A label typed under equals resolves in the Config view too

- **WHEN** the reader of the Config view picks *Equals* in the Resource type filter and types `global firewall`
- **THEN** the request carries `{ column: "resourceType", operator: "eq", value: "ImageBuildDomainWhitelist" }`
