## ADDED Requirements

### Requirement: Publication ids reach Core exactly as their input dictates
Every publication operation sends its target in the JSON request body, not in a URL path. A publication path Core issued (taken from a list, a get or a create response) is already percent-encoded, so `get`, `approve`, `reject`, `delete` and `update` SHALL send it unchanged after the `publications/` prefix, whatever it contains: `/`, a space (`%20`) or a literal `%` (`%25`). A folder a user typed for the rule list SHALL be encoded per `/`-separated segment with a trailing slash. A target folder for `create` SHALL be sent as the caller gives it; the caller encodes it.

#### Scenario: Core-issued id with an encoded space and slash is not re-encoded
- **WHEN** a publication whose path is `public/My%20Folder/req%2520__1` is approved, rejected or deleted
- **THEN** the request body `url` is `publications/public/My%20Folder/req%2520__1`

#### Scenario: Get uses the same id
- **WHEN** that publication is fetched
- **THEN** the request body `url` is `publications/public/My%20Folder/req%2520__1`

#### Scenario: Typed folder is encoded for the rule list
- **WHEN** the rules of the folder `My Folder/100%` are read
- **THEN** the request body `url` is `My%20Folder/100%25/`

#### Scenario: Created publication can be approved by its returned url
- **WHEN** a publication is created and Core returns `publications/public/My%20Folder/`, and that publication is then approved with the path left after the `publications/` prefix
- **THEN** the approve request body `url` is `publications/public/My%20Folder/`

#### Scenario: A folder with a space agrees across rule list and create
- **WHEN** the rules of the folder `My Folder` are read, then a publication for it is created and approved through the folder flow
- **THEN** the rule-list body is `My%20Folder/`, the create body's target folder is `public/My%20Folder/`, and the approve body is the url Core returned, unchanged

### Requirement: Publication reads distinguish forbidden from failed
The publication list and the publication get SHALL resolve to the parsed publication data on success, `undefined` when Core answers 403, and `null` on any other failure or cancelled request. A publication whose status is approved or rejected SHALL still resolve to `null` from the get, as before. The publication pages SHALL treat an `undefined` result as no data, the same as `null`.

#### Scenario: Forbidden list
- **WHEN** Core answers the publication list with 403
- **THEN** the list resolves to `undefined`, and the publications page's server data is left `null`

#### Scenario: Forbidden get
- **WHEN** Core answers a publication get with 403
- **THEN** the get resolves to `undefined`, and the publication view page's server data is left `null`

#### Scenario: Other failures
- **WHEN** Core answers a publication get with 404 or 500, or the call is aborted
- **THEN** the get resolves to `null`

### Requirement: Publication list reads Core's envelope shape
The publication list SHALL read the publications from the `publications` array of Core's response object, and SHALL map each entry as before. An entry without a `url`, or without a `status`, or with no resource type, SHALL be left out of the list.

#### Scenario: List reads the publications array
- **WHEN** Core answers the list with `{ "publications": [ ... ] }`
- **THEN** each entry with a url, a status and a known resource type appears in the result, tagged with its resource type

#### Scenario: Incomplete entries are skipped
- **WHEN** an entry has no `url`, or no `status`, or an empty resource type list
- **THEN** it is not in the result and the other entries are unaffected

### Requirement: Publication operations keep the envelope of the previous client
Create, rule list, approve, reject, delete and update SHALL resolve to the same envelope as before: success decided by the HTTP status, the `etag` header returned, failures normalized by the Core error normalizer, and a cancelled request resolved to `{ success: false, status: 0, errorMessage: 'Request cancelled' }`. An empty success body SHALL resolve as a success. The rule list SHALL keep each rule's `function`, `source` and `targets` exactly as Core returned them: an unknown `function` value passes through, and a missing `source` or `targets` stays absent.

#### Scenario: Approve answered with an empty body
- **WHEN** Core answers approve, reject or delete with a 2xx status and an empty body
- **THEN** the envelope has `success: true`

#### Scenario: Rejected approve
- **WHEN** Core answers approve with 403 and a plain-text body
- **THEN** the envelope has `success: false`, status 403 and the normalized message

#### Scenario: Rules pass through unvalidated
- **WHEN** Core answers the rule list with a rule whose `function` is not one the admin knows and another with no `targets`
- **THEN** both rules are returned as Core sent them, with no default added

#### Scenario: Update sends the publication, not the credentials flag
- **WHEN** a publication is updated
- **THEN** the body carries the publication's url, name, target folder, resources, resource types, rules and display author, and no `publishCredentials`
