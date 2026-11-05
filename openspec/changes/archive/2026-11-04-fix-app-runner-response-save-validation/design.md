## Context

`RouteProperties` shows local response errors but opts app routes out of global field validation. The Platform App Runner object-native editor does not register aggregate validity, and `AppRunnerAssetView` validates only when Save is activated. DIAL Core stores app-runner schema bodies verbatim, so the frontend must protect writes.

## Goals / Non-Goals

**Goals:** Match form and save-time response validation and disable form Save for invalid responses anywhere in the runner's staged route map.

**Non-Goals:** Change the shared header or unrelated validation rules.

## Decisions

- Derive response validity from the entire `selectedRunner` in `AppRunnerAssetView` and register an aggregate field in `SaveValidationContext`, so the existing header consumes it without an additional prop. Keep registration at view scope, restore it after context resets, and remove it on unmount; registering only the active route would permit invalid inactive routes to be saved.
- Reuse response-only validation in the existing `validateAppRunner` save guard. The form's rules accept numeric status values from 100 to 999 inclusive and non-empty body strings; numeric strings and whitespace-only bodies follow the existing form. Do not disable form Save for unrelated existing validator errors, which retain the existing notification on save.
- In the shared `RouteProperties`, derive upstream-required state from the current route's response rather than storing a separate state. This prevents a route switch from retaining the previous route's upstream requirement and leaving a hidden endpoint error registered. The same correctness fix applies to other callers of this shared form.
- Keep the shared JSON editor behavior: Save is available in JSON mode and the existing save guard reports invalid response values before an update reaches Core. Changing global JSON-button behavior would affect unrelated views.

## Risks / Trade-offs

- An existing invalid inactive response can disable form Save without its inline error being visible → the route editor remains navigable so the user can locate and correct or remove the response.
- Raw JSON may contain malformed values → the response validator handles unknown inputs safely and reports the existing error notification instead of throwing.
