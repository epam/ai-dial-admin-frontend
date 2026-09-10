## Why

The Evaluators page reads the registry and offers no write, so the first version of every evaluator
has to be posted by hand against `POST /v1/evaluators`. Issues #4289 and #4290 both deferred this
on purpose — "Registering an evaluator or a new version is a follow-up and not part of this
ticket" — and registering a *further* version has since shipped on the detail page. What is missing
is the door for version 1, which no other surface can offer: the detail page needs an evaluator to
exist before it can open one.

Issue: #4501.

## What Changes

- The Evaluators listing gains a **Create evaluator** control, offered to a full admin only, that
  opens a modal registering version 1 through the existing `createEvaluator` server action
  (`src/app/[lang]/evaluators/actions.ts`).
- The modal carries only the members `POST /v1/evaluators` requires, and validates them before
  submitting. Everything optional on the wire is authored afterwards on the detail page.
- **The listing's own requirement is re-decided.** `openspec/specs/analytics/evaluators/spec.md`,
  requirement *Evaluators listing grid*, currently ends:

  > The listing SHALL offer no create, edit, or delete action on any row.

  On a literal reading the qualifier is row-scoped, and its scenario is too ("**THEN** no row
  exposes a create, edit, or delete action") — a page-header control would fall outside it. We are
  **not** taking that reading. The prose reads as a statement about the page, it is the sentence a
  reviewer will cite, and the neighbouring requirement *A registered version is never changed or
  removed* independently forbids edit and delete "anywhere … not on the listing" while naming
  registering as the one write the console may offer. The delta therefore **modifies** *Evaluators
  listing grid*: the row-level prohibition on edit and delete stays, and the page-level create is
  stated explicitly rather than left to inference.

### The minimum, taken from the Java rather than from this frontend

`CreateEvaluatorRequest` (analytics-data-access-service,
`src/main/java/com/epam/aidial/analytics/web/dto/enrichment/CreateEvaluatorRequest.java`) plus
`EvaluatorService.requireValidShape`
(`src/main/java/com/epam/aidial/analytics/service/enrichment/EvaluatorService.java`) settle what
"minimally required" means:

| Member | Status on the wire |
|---|---|
| `name` | required (`@NotBlank`); no pattern, no length |
| `type` | required (`@NotNull`, enum `LLM` \| `SQL`) |
| `preset` | **llm**: required (`chat_completion` is the only value) — **sql**: rejected |
| `model` | **llm**: required, non-blank — **sql**: rejected |
| `output_vars` | **sql**: ≥ 1, each with a non-blank `type` and `sql` and no `jsonata` — **llm**: not required by the service |
| `params`, `request_template`, `input_vars`, `response_schema` | optional for **llm**; a non-empty value is rejected for **sql** |
| `version`, `created_at` | server-assigned; not members of the request record at all, and `StrictRequestJsonConfiguration` fails the body on an unknown property |

Nothing required is unauthorable in a modal — the answer to that question is a plain "it fits". The
largest piece is one output-variable row (name, type, expression), and `EvaluatorVarsEditor.tsx`
already renders exactly that row.

So the modal presents **Name**, **Type**, **Output variables** (≥ 1), and — when the type is
`llm` — **Preset** and **Model**. It reuses `isEvaluatorShapeValid` from
`src/utils/analytics/evaluator-dto.ts` unchanged, which is deliberately **stricter than the
service** on one point: it requires at least one output variable for an `llm` evaluator too. That
stays, for two reasons. It is already the console's answer for this same POST on the detail page,
and re-deciding it here would give one request two different notions of valid. And an evaluator
declaring no output variable produces nothing an enrichment pipeline can bind —
`Pipelines/Enrich/use-enrich-form.ts` already refuses such a pipeline for `sql` and tracks
`isLlmWithoutBindings` for `llm`.

**Decision: an `llm` evaluator created with no request template is accepted.** `request_template`
is optional on the wire and the detail page owns its bounded presentation, so the modal does not
offer it. The consequence is deliberate: a freshly created `llm` evaluator is a valid registered
version that carries no request template until a second registration adds one.

### Type, and what a type change implies

Type is presented **before** the members that depend on it, as a radio group — the shape
`Pipelines/CreatePipelinePopup.tsx` uses for a pipeline's `kind`. Selecting `sql` withdraws Preset
and Model; selecting `llm` offers them and requires both. The request is rebuilt from the selected
type on submission rather than accumulated, which `buildEvaluatorDto` already does: it deletes the
six llm-only members for a `sql` draft and restates each output variable's expression under `sql` or
`jsonata` to match. That is what keeps a type flipped mid-modal from carrying a member the service
answers 422 for, and it is the behaviour the shipped requirement *A sql evaluator omits the members
its type forbids* already demands of the detail page.

### Name: format is a console convention, uniqueness is only decidable on the client

The service constrains a name to `@NotBlank` and nothing else. The console already knows this:
`EvaluatorUsage` in `src/models/analytics/evaluator.ts` is a `Map` rather than a `Record`
specifically "because an evaluator name is only `@NotBlank` on the service, so `constructor`,
`toString`, and `__proto__` are all registerable". The name is also a path segment on both sides
(`/v1/evaluators/{name}`, and `evaluatorDetailHref` in `Evaluators/utils.ts`). The modal is the only
place the console can ever constrain it, because no surface renames an evaluator.

**Decision: the name follows the pattern the console already applies to the sibling registry
name** — `isValidPipelineName` / `/^[a-z][a-z0-9_-]{0,63}$/` in
`Pipelines/Common/use-pipeline-form.ts`, itself a console convention rather than a mirror of a
service constraint (`PipelineRequests` constrains a pipeline name to `@NotBlank` too). Nothing
renames an evaluator, so no already-registered name is retro-invalidated by this.

Uniqueness is the sharper problem, and it is **not** symmetrical with pipelines. `PipelineService`
answers `PipelineConflictException` for a name already in use; `EvaluatorService.register` does the
opposite — a name that exists is read as *append version `latest_version + 1`* and answered `201`.
A duplicate name typed into a create modal would therefore silently add a version to an evaluator
somebody else owns, and be reported as a success. So:

- uniqueness is decided **client-side, before the request**, against the names already on the
  listing — the rows `EvaluatorsView` is given — and reported **inline in the modal**. Inline
  rather than as a notification is the house convention, established by #3551 and #3580, both filed
  as bugs because a duplicate name surfaced as a backend notification instead of inline validation
  in a create modal;
- the residual race — a name registered elsewhere since the page loaded — cannot be closed by the
  client, and cannot be closed on the server either without a service change. **Decision: it is
  told apart by the response's `version`.** The response is an `EvaluatorVersionDto` carrying
  `version`, so a `version` other than 1 means the request appended a version to an existing
  evaluator rather than creating one, and the success message SHALL say which of the two happened
  rather than report a plain "created".

### After a successful create

**Decision: the operator stays on the listing.** Success reports a notification, the modal closes,
and the grid is refreshed — the shape `Pipelines/Common/CreatePipelineShell.tsx` establishes
(`onCreated()` then `onClose()`), driven from `Pipelines/PipelinesView.tsx`. The competing
precedent, *Saving creates the next version after the latest* ("a successful registration SHALL
report success and open the created version"), governs the detail page, where the operator was
already looking at a version; it is not the listing's rule.

One integration wrinkle, unlike pipelines: the listing's **used by** column is joined on the server
from a single pipelines fetch in `src/app/[lang]/evaluators/page.tsx`, and the shipped requirement
forbids the grid from issuing a per-row request. `getEvaluators()` returns no `usedBy`, so
refreshing by calling the server action the way `PipelinesView.reload` does would leave the new
row's count unknown. Re-running the server component keeps the join where the spec puts it. The
mechanism is the SA's call; the requirement is that the created evaluator appears with a real
used-by count of **0** rather than as unknown.

### Who sees the control

`POST /v1/evaluators` is the one evaluator endpoint marked `@FullAdminOnly` — "every read is open",
per the shipped requirement *Registering a version requires full-admin rights*. The control is
gated on `isFullAdmin` from `AppContext` and **hidden**, not disabled, for anyone else, matching
`Pipelines/PipelinesView.tsx`. That is a narrow departure from the same requirement's "every control
rendered as disabled rather than hidden", which exists so a read-only caller can still *read* every
value of a definition; a Create button carries no value to read, and a permanently disabled one on a
page that is otherwise fully readable states a permission rather than a fact. The delta says this
explicitly instead of leaving the two sentences to be reconciled by a reader.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/evaluators`: *Evaluators listing grid* — replace the sentence forbidding a create
  action with a page-level Create control gated on `isFullAdmin`, keeping the row-level prohibition
  on edit and delete; restate the scenario *No row offers a mutation* accordingly.
- `analytics/evaluators`: *Registering a version requires full-admin rights* — state that the
  listing's Create control is withheld rather than disabled for a caller without the right, and why
  that does not contradict the disabled-not-hidden rule for the detail page's controls.
- `analytics/evaluators`: new requirements for the create modal itself — the member set it presents
  and requires per type, name format and client-decided uniqueness reported inline, the type change
  rebuilding the request, and what happens after a success.

## Impact

- **Code**: `components/Analytics/Evaluators/EvaluatorsView.tsx` (gains the header control and stops
  being a pure renderer of its props); a new create-modal component and form hook beside it;
  `src/app/[lang]/evaluators/page.tsx` if the refresh path re-runs the server component. Reused
  unchanged: `createEvaluator` in `src/app/[lang]/evaluators/actions.ts`, `CreateEvaluatorDto` in
  `src/models/analytics/evaluator.ts`, `buildEvaluatorDto` / `isEvaluatorShapeValid` in
  `src/utils/analytics/evaluator-dto.ts`, `EvaluatorVarsEditor.tsx`, `withStrandedOption` in
  `Evaluators/utils.ts`, `EVALUATOR_VAR_TYPES`.
- **Shared components and contexts**: `AppContext` (read only, for `isFullAdmin`),
  `NotificationContext`, `GridView`, and the ui-kit controls the pipelines create popup already uses
  (`DialFormPopup`, `DialInput`, `DialRadioGroup`, `DialSelectField`). Per the house rule, a
  mismatch between a shared control and this caller is handled in the wrapper — no new props on a
  `Common/*` component.
- **API**: no new route and no new server action; `POST /v1/evaluators` gains a second caller in the
  console. No read path changes, so the three readers the pipelines console imports from
  `evaluators/actions.ts` are untouched.
- **i18n**: new keys under `AnalyticsEvaluatorsI18nKey` in `src/constants/i18n.ts` and
  `src/locales/en.ts`.
- **Docs and specs**: the `analytics/evaluators` delta above. Nothing under `docs/` describes the
  evaluators listing.

## Non-goals

- **No editor for an optional member in the modal** — no params key/value editor, no request
  template, no input variables, no response schema. Each is optional on registration and each has a
  presentation on the detail page that the shipped spec constrains in detail (a bounded, never
  reformatted template; the schema through the JSON editor). An operator adds them by registering
  version 2.
- **No JSON-editor mode in the modal.** The JSON escape hatch belongs to the detail page, together
  with its parse-error reporting and its rule that the name in the document is disregarded.
- **No second entry point to the modal.** The listing header is the one door, matching pipelines —
  in particular the listing's existing empty state ("No evaluators", already in `EvaluatorsView`)
  gains **no** Create control of its own, even though a first-time operator may look there first.
- **No edit and no delete, anywhere.** The service has no such endpoint; `PUT` and `DELETE` exist to
  answer 409 `evaluator_immutable`.
- **No rename**, and no re-validation of a name that is already registered — the pattern applies at
  this one door only.
- **No registering a further version from the listing.** The detail page owns that, and it must,
  because a new version starts from the version on screen.
- **No `type` column on the listing.** `GET /v1/evaluators` does not return it, and the shipped
  requirement gives the reasons.
- **No server-side uniqueness check**, and no request to the analytics service to add one — that is
  a service change and a different conversation.
- **No change to the evaluator readers, to the pipelines console, or to `EvaluatorTypeBadge`.**
