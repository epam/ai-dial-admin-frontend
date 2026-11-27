## Purpose

The Content-Security-Policy the Admin Console sends with its pages: which responses carry it, the report-only and
enforcing modes, how scripts are authorised, and the directives it always states.

## ADDED Requirements

### Requirement: Page responses carry one Content-Security-Policy
Every HTML page the console serves under a locale route SHALL carry exactly one Content-Security-Policy header,
either `Content-Security-Policy` or `Content-Security-Policy-Report-Only`, never both. API routes and static files
SHALL carry neither.

#### Scenario: A page response
- **WHEN** a browser requests a console page such as `/en/home`
- **THEN** the response carries one of the two policy headers and not the other

#### Scenario: An API response
- **WHEN** a client requests a route under `/api/`
- **THEN** the response carries neither policy header

### Requirement: The policy is report-only unless enforcement is switched on
The policy SHALL be sent as `Content-Security-Policy` only when `CSP_MODE` is `enforce`, compared without regard to
case or surrounding whitespace. With any other value, or with `CSP_MODE` unset, it SHALL be sent as
`Content-Security-Policy-Report-Only`. The directives SHALL be the same in both modes.

#### Scenario: Mode is not set
- **WHEN** `CSP_MODE` is unset
- **THEN** a page response carries `Content-Security-Policy-Report-Only`

#### Scenario: Enforcement is switched on
- **WHEN** `CSP_MODE` is `enforce` or ` Enforce `
- **THEN** a page response carries `Content-Security-Policy`

#### Scenario: An unknown mode
- **WHEN** `CSP_MODE` is `off`, `true` or any other value
- **THEN** a page response carries `Content-Security-Policy-Report-Only`

### Requirement: The mode is read when the server runs
The policy's mode SHALL be taken from the environment of the running server. A value set on the deployment SHALL
take effect after a restart, without rebuilding the image.

#### Scenario: Enforcement is set on the deployment
- **WHEN** an image built without `CSP_MODE` is started with `CSP_MODE` set to `enforce`
- **THEN** a page response carries `Content-Security-Policy`

### Requirement: Scripts are authorised by a per-response nonce
`script-src` SHALL contain `'self'`, a nonce and `'strict-dynamic'`, and SHALL NOT contain `'unsafe-inline'`. The
nonce SHALL differ between responses, and every script the console itself emits into a page SHALL carry the nonce
of that response. `'unsafe-eval'` SHALL be present only when the server runs in development mode.

#### Scenario: Two responses
- **WHEN** the same page is requested twice
- **THEN** the two responses carry different nonces

#### Scenario: The console's own scripts
- **WHEN** a page is rendered
- **THEN** each script element in the document carries the nonce stated in that response's policy

#### Scenario: A production server
- **WHEN** the server runs in production mode
- **THEN** `script-src` contains neither `'unsafe-inline'` nor `'unsafe-eval'`

### Requirement: The policy states each directive explicitly
The policy SHALL state each of the following directives, so that none of them takes its value from `default-src`:
`default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `worker-src`,
`object-src`, `base-uri` and `frame-ancestors`. `object-src` SHALL be `'none'`, `base-uri` SHALL be `'self'`, and
`frame-ancestors` SHALL be `'none'`.

#### Scenario: A page response in either mode
- **WHEN** a page response is inspected
- **THEN** its policy contains each listed directive exactly once

#### Scenario: Embedding the console
- **WHEN** a page response is inspected
- **THEN** `frame-ancestors` is `'none'`

### Requirement: Frame, image and connection sources are fixed
`frame-src` SHALL be `'self' https:`, `img-src` SHALL be `'self' data: blob:` and `connect-src` SHALL be `'self'`.
No environment variable SHALL change a source list.

#### Scenario: A page response on any deployment
- **WHEN** a page response is inspected
- **THEN** `frame-src` is `'self' https:`, `img-src` is `'self' data: blob:` and `connect-src` is `'self'`

### Requirement: Console features keep working under an enforced policy
With `CSP_MODE` set to `enforce`, the console SHALL load and behave as it does without a policy, and the browser
SHALL report no policy violation on the pages below.

#### Scenario: A list page
- **WHEN** a user opens an entity list page
- **THEN** the page renders its header, menu and grid, the theme logo is shown, and the browser reports no policy
  violation

#### Scenario: An entity icon
- **WHEN** a user opens an entity whose icon is a theme file
- **THEN** the icon is shown, and the browser reports no policy violation

#### Scenario: The code editor
- **WHEN** a user opens a view that shows the JSON editor
- **THEN** the editor renders its content with syntax highlighting, and the browser reports no policy violation

#### Scenario: The Parameters tab iframe
- **WHEN** a user opens the Parameters tab of an application that has an editor URL on an `https:` origin
- **THEN** the embedded editor is loaded in its iframe, and the browser reports no policy violation

#### Scenario: A live stream
- **WHEN** a user opens a container's execution log
- **THEN** log lines arrive in the view, and the browser reports no policy violation
