## ADDED Requirements

### Requirement: The Analytics list filters its identifier columns by exact match

The `Analytics` view's **Activity ID** and **Parent ID** column filters SHALL offer only the *Equals* and
*Does not equal* operators, with *Equals* as the default, because the analytics backend accepts a substring
(`co`) match only on string columns and rejects it on a UUID column. A value typed into one of these columns'
floating filter SHALL therefore be sent with the `eq` operator. Because the backend also refuses a value that is
not a UUID, and no activity carries one, an *Equals* on text that is not a UUID SHALL give an empty list without
sending a request, and a *Does not equal* on such text SHALL apply no restriction. The other columns of the list,
including **Resource identifier**, SHALL keep their text operators. The `Config` and `Deployments` views SHALL
keep the operators they offer today.

#### Scenario: Activity ID offers no substring operator

- **WHEN** the reader opens the filter menu of the Activity ID or Parent ID column
- **THEN** the operator choices are Equals and Does not equal, with Equals selected
- **AND** the Resource identifier column still offers Contains and Does not contain

#### Scenario: A typed identifier is sent with equals

- **WHEN** the reader types a UUID into the Activity ID filter
- **THEN** the request carries `{ column: "activityId", operator: "eq", value: <that UUID> }`

#### Scenario: Text that is not a UUID gives an empty list without a request

- **WHEN** the reader picks *Equals* in the Activity ID filter and types `abc`
- **THEN** the list shows no rows and no list request is sent

#### Scenario: Config and Deployments keep their operators

- **WHEN** the Config or Deployments view is shown
- **THEN** its Activity type, Resource type and ID columns offer the same operators as before

### Requirement: The Analytics list picks Activity type and Resource type from a list of values

The `Analytics` view's **Activity type** and **Resource type** column filters SHALL be lists of the values the
analytics backend defines, each with a checkbox, a *Select all* checkbox and a *Reset* action, in place of a text
entry: the activity types `Create`, `Update` and `Delete`, and the resource types `Table`, `Table column`,
`Pipeline` and `Saved query`. The filter SHALL request the picked values with the `in` operator, so a value the
backend refuses cannot be entered. With nothing picked the column SHALL not be filtered. The `Config` and
`Deployments` views SHALL keep their text filters on these columns.

#### Scenario: The filter lists the backend's values

- **WHEN** the reader opens the Activity type filter, and then the Resource type filter, of the Analytics list
- **THEN** the first lists `Create`, `Update` and `Delete`
- **AND** the second lists `Table`, `Table column`, `Pipeline` and `Saved query`

#### Scenario: Picked values are requested with in

- **WHEN** the reader picks `Table` and `Table column` in the Resource type filter
- **THEN** the request carries `{ column: "resourceType", operator: "in", value: "Table,TableColumn" }`

#### Scenario: Reset removes the filter

- **WHEN** the reader activates *Reset* in a filter with values picked
- **THEN** the column is no longer filtered

### Requirement: A resource-type label typed under equals resolves to its type

Under *Equals* or *Does not equal*, a **Resource type** filter entered as text SHALL resolve a typed label that
equals, ignoring case, the display label of exactly one resource type to that type, and SHALL send any other typed
value unchanged. A label shared by several resource types is sent unchanged. The `Config` and `Deployments` views
use this resolution.

#### Scenario: A label typed under equals resolves in the Config view

- **WHEN** the reader of the Config view picks *Equals* in the Resource type filter and types `global firewall`
- **THEN** the request carries `{ column: "resourceType", operator: "eq", value: "ImageBuildDomainWhitelist" }`

#### Scenario: A label shared by several types is sent unchanged

- **WHEN** the reader of the Config view picks *Equals* in the Resource type filter and types `model serving`
- **THEN** the request carries the typed text unchanged

### Requirement: A failed Analytics list request is reported

When the request for a page of the Analytics list fails — the backend refuses a filter, or the request is
rejected — the list SHALL show the backend's error as a notification, with its header, message and request
identifier when it carries them, and SHALL show no rows rather than staying as it was. The requests that resolve
a page's parents and an import's activities are not reported: they fail open by design, and the page is listed
without them. The `Config` and `Deployments` lists keep their behaviour.

#### Scenario: A refused filter is shown

- **WHEN** the backend answers the list request with an error describing an invalid filter value
- **THEN** a notification shows that error
- **AND** the list shows no rows

#### Scenario: A failed lookup is not reported

- **WHEN** the request that resolves a page's parent activities fails while the page request succeeded
- **THEN** no notification is shown and the page is listed

## REMOVED Requirements

### Requirement: The Analytics list filters enum and identifier columns by exact match

**Reason**: Only the identifier columns stay exact-match; Activity type and Resource type become value lists.

**Migration**: "The Analytics list filters its identifier columns by exact match", "The Analytics list picks
Activity type and Resource type from a list of values" and "A resource-type label typed under equals resolves to
its type" replace it.
