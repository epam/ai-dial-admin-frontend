## ADDED Requirements

### Requirement: A client-issued analytics query is cancellable and its cancellation reaches the service

A page that issues analytics queries from the client SHALL be able to cancel them, and a cancelled query
SHALL stop the work behind it rather than only stopping the caller from listening.

Client-issued queries SHALL therefore go through a **route handler**, `POST /api/analytics/query`, and not
through a server action. A server action carries no `AbortSignal`: the client cannot call it off, so a page
left mid-load keeps its reads running and receives, from the framework rather than from the service, an
error it then reports as a failed load. The handler SHALL delegate to the same `analyticsDataApi` method as
the equivalent server action and SHALL return the same `ServerActionResponse<T>` envelope, so nothing but
the transport differs.

The handler SHALL **refuse a caller it cannot authenticate** while authentication is enabled, rather than
passing the request on without an authorization header. The app's middleware does not cover `/api`, whereas
a server action posts to a page path it does cover, so the guard the action inherited has to be stated here
— and what is behind this endpoint is read-only SQL against the analytics service.

Every answer SHALL be that same envelope, failures included: a request carrying neither a query nor a
statement, and a transport error the client throws, both reach the caller as an envelope rather than as a
framework error page, which the caller cannot parse and would report as a parser fault.

The handler SHALL pass the **incoming request's abort signal** through to the data-access call, and
`BaseApi` SHALL honour an external signal alongside the one it already keeps for logout. A client that
aborts therefore ends the service request too.

Server-side prefetch SHALL continue to use server actions: a page's initial data is fetched before anything
is on screen, so there is no caller to cancel it. This requirement governs queries a mounted view issues
for itself.

Cancellation SHALL be handled in **one place**: a shared hook that owns the controllers for the view using
it and aborts them when that view unmounts. Every client caller of the analytics query endpoint SHALL use
it rather than issuing its own request.

A cancelled query SHALL NOT be reported as a failure — no error state, no notification. Nothing is waiting
for the answer, and a page the operator has left is not a page to raise an alarm on. A failure the service
did report SHALL be surfaced as before, carrying the service's own message.

#### Scenario: Leaving a page cancels the queries it started

- **GIVEN** a view whose queries are still in flight
- **WHEN** the operator navigates away before they resolve
- **THEN** each in-flight query is aborted
- **AND** the service request behind it is ended rather than left running

#### Scenario: A cancelled query raises nothing

- **GIVEN** a view whose queries are still in flight
- **WHEN** the operator navigates away and a cancellation reaches the caller
- **THEN** no error notification is raised
- **AND** no widget records a load failure

#### Scenario: A real failure is still reported

- **WHEN** the service refuses a client-issued query
- **THEN** the caller receives the envelope's `errorMessage` or `errorHeader`
- **AND** the failure is reported as it was before

#### Scenario: An unauthenticated caller is refused

- **GIVEN** authentication is enabled and the caller carries no session
- **WHEN** it posts a query to the route handler
- **THEN** the handler answers 401 and issues no request to the analytics service

#### Scenario: A transport failure reaches the caller as an envelope

- **WHEN** the call to the analytics service throws rather than answering
- **THEN** the caller receives a failure envelope carrying the thrown message
- **AND** no framework error page reaches it in place of one

#### Scenario: Server-side prefetch is unchanged

- **WHEN** an Analytics page prefetches its initial data
- **THEN** it does so through a server action delegating to `analyticsDataApi`, not through the route
  handler
