# request-cancellation-on-logout Specification

## Purpose

Logging out cancels every in-flight API request, so none completes with a stale authentication token or is processed after the user has left.

## Requirements

### Requirement: Every BaseApi request is tracked for cancellation

`BaseApi.sendRequest` SHALL register an `AbortController` with the request registry for every request, pass its signal to `fetch`, and unregister it when the request completes, so the registry holds only requests still in flight.

#### Scenario: A completed request leaves the registry

- **WHEN** a request made through `BaseApi` completes
- **THEN** its controller SHALL be removed from the registry

### Requirement: Logging out cancels all tracked requests

`use-logout.ts` SHALL call `requestRegistry.cancelAll()` before `signOut()`, and the `signOut` event in `auth-options.ts` SHALL call it as well, as a fallback. `cancelAll()` SHALL abort every registered controller, clear the registry, and be safe to call more than once. Streaming (SSE) requests SHALL be closed the same way.

#### Scenario: A long request is cancelled by logout

- **GIVEN** the user started a long-running request such as "Export All"
- **WHEN** the user clicks "Log Out" before it completes
- **THEN** the request SHALL be aborted
- **AND** its response SHALL NOT be processed
- **AND** the user SHALL be redirected to the login page without delay

#### Scenario: Repeated logout is harmless

- **WHEN** `signOut()` is triggered several times in quick succession
- **THEN** `cancelAll()` SHALL run each time without error

#### Scenario: A request that finished just before cancellation

- **WHEN** a request completes moments before `cancelAll()` reaches it
- **THEN** its controller SHALL already be unregistered and no error SHALL be raised

### Requirement: A cancelled request is not reported as a failure

An `AbortError` raised by a cancelled request SHALL be handled silently: it SHALL NOT trigger an error notification, a log entry or a retry.

#### Scenario: No error toast after logout

- **WHEN** logout aborts an in-flight request
- **THEN** no error notification SHALL be shown for it
