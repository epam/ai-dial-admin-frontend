## Purpose

The instance-wide allowlist of DIAL application routes an enrichment pipeline may call: what a pair is, where
the list is edited and stored, how it is validated, and how a refused write is reported.

## ADDED Requirements

### Requirement: The allowlist is an ordered list of deployment and route pairs

The allowlist SHALL be one ordered list of pairs, each a **deployment** (a DIAL application's deployment id)
and a **route** (the path under that deployment's `route/` prefix). It is read with
`GET /v1/settings/app-routes` and replaced whole with `PUT /v1/settings/app-routes`, whose body is
`{ routes: [{ deployment, route }] }`. The stored value also carries `updated_at` and `updated_by`, which the
console SHALL NOT send back.

A read answered `404` means no allowlist is stored, which allows no route. The console SHALL present that as
an empty list and SHALL NOT report it as an error.

An empty list is a valid value and SHALL be saveable: it is how every route is revoked.

#### Scenario: No stored allowlist reads as an empty list

- **WHEN** the tab is opened and the service answers `404` for the setting
- **THEN** the list is presented empty
- **AND** no error notification is shown

#### Scenario: A stored allowlist is presented in its written order

- **WHEN** the tab is opened and the service returns three pairs
- **THEN** the three pairs are presented in the order the service returned them

#### Scenario: An emptied list can be saved

- **WHEN** the operator removes the last pair and saves
- **THEN** the write carries an empty `routes` list

### Requirement: The allowlist is edited on the System Properties page and stored by the analytics service

The allowlist SHALL be edited on an **Enrichment routes** tab of the System Properties page and SHALL be
stored by the analytics service as one value per instance. The tab SHALL be offered only when Analytics is
enabled.

The tab SHALL present one row per pair with a deployment control, a route control and a remove action, plus an
action that adds an empty row. Each remove action SHALL carry an accessible name that identifies its row.

The tab SHALL state, as visible text, what the list governs: that an enrichment pipeline calling an
application route can be enabled only when its pair is listed.

For a read-only administrator the controls SHALL be disabled and the Save action SHALL NOT be offered as
usable.

A failed read of the stored allowlist, other than `404`, SHALL be reported by an error notification, and the
tab SHALL NOT present an empty list as the stored one.

#### Scenario: A pair is added

- **WHEN** the operator adds a row, enters a deployment and a route, and saves
- **THEN** the write carries the stored pairs followed by the new one
- **AND** a success notification is shown

#### Scenario: The tab is absent without Analytics

- **WHEN** Analytics is disabled
- **THEN** the Enrichment routes tab is not offered

#### Scenario: A read-only administrator cannot edit

- **WHEN** a read-only administrator opens the tab
- **THEN** the deployment, route, add and remove controls are disabled

#### Scenario: A failed read is not shown as an empty allowlist

- **WHEN** the read of the setting fails with a status other than `404`
- **THEN** an error notification carries the service's message
- **AND** the tab does not present an empty list as the stored value

### Requirement: Deployment and route are picked from DIAL Core's applications, and a typed value is accepted

The deployment control SHALL suggest the DIAL Core applications the console can list, and the route control
SHALL suggest the paths of the routes declared on the application named in that row's deployment control.
Both controls SHALL accept a typed value that matches no suggestion: an application route's path may be a
pattern rather than a literal path, and a pair may be allowed before its application exists on the instance.

When the applications cannot be listed, both controls SHALL remain usable as free-text fields and no error
SHALL be reported for the missing suggestions.

#### Scenario: Routes follow the chosen application

- **WHEN** the operator picks an application that declares two route paths
- **THEN** the route control of that row suggests those two paths

#### Scenario: A value outside the suggestions is kept

- **WHEN** the operator types a deployment that matches no listed application and a route
- **THEN** the row holds the typed values and can be saved

#### Scenario: The fields work without suggestions

- **WHEN** the applications listing fails
- **THEN** both controls accept typed values
- **AND** no error notification is shown

### Requirement: A pair is validated before save

The console SHALL validate each row with the service's own rules and SHALL disable Save while any row is
invalid, stating the reason on the offending field:

- **deployment** — required; at most 256 characters; no whitespace, control or format character, `\`, `?`,
  `#` or `%`. A `/` is allowed between segments, but not first or last, and no segment may be empty, `.` or
  `..`.
- **route** — required; at most 256 characters; one or more segments of letters, digits and `._~-` separated
  by single `/`; no leading or trailing `/`; no `.` or `..` segment.
- **the list** — no pair repeated, compared exactly and case-sensitively; at most 100 pairs.

A row whose two fields are both blank SHALL be treated as not yet authored: it SHALL NOT invalidate the list
and SHALL NOT be sent.

#### Scenario: A route with a leading slash is refused

- **WHEN** the operator enters a route beginning with `/`
- **THEN** the route field states the path rule
- **AND** the Save action is disabled

#### Scenario: A deployment that could leave the deployments path is refused

- **WHEN** the operator enters a deployment with a `..` segment, a doubled `/` or a backslash
- **THEN** the deployment field states the rule it breaks
- **AND** the Save action is disabled

#### Scenario: A repeated pair is refused

- **WHEN** two rows hold the same deployment and the same route
- **THEN** the later row states that the pair is repeated
- **AND** the Save action is disabled

#### Scenario: A pair differing only in case is distinct

- **WHEN** two rows hold routes that differ only in letter case
- **THEN** neither row is reported as repeated

#### Scenario: A blank row is ignored

- **WHEN** the operator adds a row, leaves both fields blank, and saves
- **THEN** the write does not carry that row

#### Scenario: The list is capped

- **WHEN** the list holds 100 pairs
- **THEN** the add action is disabled

### Requirement: A refused write reports the service's message and keeps the edits

A write the service refuses SHALL be reported by an error notification carrying the service's own message,
and the tab SHALL keep the operator's unsaved rows. This covers the refusal of a write that drops a pair an
enabled pipeline still calls (`409 app_route_in_use`), whose message names those pipelines; the console SHALL
NOT replace that message with its own wording.

#### Scenario: Dropping a pair in use is refused in the service's words

- **WHEN** the operator removes a pair an enabled pipeline calls and saves
- **THEN** an error notification carries the service's message naming the pipeline
- **AND** the removed row is still absent from the unsaved list, which stays marked as changed

#### Scenario: A rejected save shows no success

- **WHEN** the save is refused
- **THEN** no success notification is shown
