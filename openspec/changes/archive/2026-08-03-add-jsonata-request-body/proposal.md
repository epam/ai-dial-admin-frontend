## Why

A Test Suite's request body can only be authored today as a literal JSON object (or form-data parts) with
`${{var}}` placeholders substituted in. That is not expressive enough for suites whose request payload has to
be *computed* from test-case data — conditional fields, arrays built from a dataset column, values derived from
other values. The backend now accepts a JSONata expression for the whole body (`jsonataContent`) and evaluates
it at run time, so the admin UI needs a way to author that expression.

JSONata is already the expression language this feature uses for the other direction — response columns
(`EndpointSchema/Columns`) evaluate JSONata against the response body via the `jsonata` package. Supporting it
on the request side makes the request and response halves of a Test Suite symmetric.

## What Changes

- **New backend field** `jsonataContent?: string` on `TestSuiteRequestTemplateBody`
  (`src/models/evaluation/test-suite.ts:126`). It is **mutually exclusive** with the existing `content` field —
  exactly one of the two is populated at any time, on the wire and in local state.
- **New "JSONata" toggle** (`DialSwitch` from `@epam/ai-dial-ui-kit`) in the Request Template header row, placed
  before the existing `ContentTypeSelect`. It is rendered when the body content type is `application/json`, or
  whenever `jsonataContent` is present regardless of content type — the second clause guarantees a user who
  loads a suite with an expression under a form-data or absent content type can always toggle back out. It is
  absent for `multipart/form-data` with no expression.
- **Body tab becomes a 3-way branch** instead of the current 2-way (`EntityJsonEditor` vs `FormDataGrid`):
  JSONata editor / JSON editor / form-data grid.
- **New reusable Monaco wrapper** `src/components/Common/JsonataEditor/` — a thin component over the existing
  `JsonEditorBase`, registering a `jsonata` Monaco language (Monarch tokenizer, language configuration,
  builtin-function completions). Modeled on `Analytics/QueryBuilder/Sql/SqlEditor.tsx`, the repo's established
  precedent for a non-JSON Monaco language.
- **`JsonEditorBase` gains an optional `onBeforeMount?: (monaco: Monaco) => void` prop.** A custom Monaco
  language must be registered before the editor model is created, and the existing `onEditorMount` runs too
  late. The prop is called from the existing private `handleBeforeMount`; every current caller is unaffected.
- **`EDITOR_THEMES_CONFIG` gains JSONata token rules** in both the light and dark blocks
  (`src/constants/editor.ts:39-77`). All JSONata Monarch tokens are namespaced under the `jsonata.` prefix so
  they cannot bleed into the JSON or SQL editors.
- **Content-type switching clears the other field.** `ContentTypeSelect` currently always writes `content`;
  switching away from `application/json` while JSONata mode is on must also clear `jsonataContent`, or both
  fields would end up populated and the exclusivity contract would break.
- New i18n keys for the toggle label.

### Non-goals

- The MCP branch of the Method tab (`McpMethodContent`, `ArgumentTemplate`) — unchanged.
- Response-column JSONata (`EndpointSchema/Columns`) — already exists, unchanged.
- Client-side JSONata **evaluation** or preview of the resolved body. The backend evaluates and validates on
  save.
- Client-side JSONata **syntax validation** / Monaco error markers. Out of scope for this change; the JSONata
  body therefore does not participate in `SaveValidationContext` gating the way the JSON editor does.
- Changing how `${{var}}` template variables are extracted. `getTemplateParameters`
  (`TestSuites/utils/request-template-params.ts`) already recurses over every string in the template, so a
  `jsonataContent` string is scanned for free and its variables still become input bindings — this must keep
  working, but needs no code change.
- Migrating existing suites. A suite with no `jsonataContent` simply starts in JSON mode, as today.

## Capabilities

### New Capabilities

- `test-suite-jsonata-request-body`: authoring a Test Suite deployment request body as a single JSONata
  expression — the mode toggle, its visibility rules, mutual exclusivity of `jsonataContent` and `content`,
  behavior across content-type switches, and the JSONata editor's language support (highlighting, completions,
  theming).

### Modified Capabilities

None. No existing spec in `openspec/specs/` states requirements for the Request Template body editor;
`argument-template-editor` only asserts that the DEPLOYMENT branch renders `RequestTemplate` +
`EndpointSchema`, which stays true.

## Impact

**Code — new files**

- `apps/ai-dial-admin/src/components/Common/JsonataEditor/JsonataEditor.tsx`
- `apps/ai-dial-admin/src/components/Common/JsonataEditor/constants.ts` (language id, keywords, builtin-function
  catalogue, Monarch tokenizer, language configuration)
- `apps/ai-dial-admin/src/components/Common/JsonataEditor/models.ts` (`JsonataFunction`)
- `apps/ai-dial-admin/src/components/TestSuites/RequestTemplate/components/JsonataToggle.tsx`
- `apps/ai-dial-admin/src/components/TestSuites/utils/body-content.ts` (`getDefaultContentForType`, lifted out
  of `ContentTypeSelect` so the toggle and the content-type dropdown share one definition of "empty body for
  this content type")

**Code — modified**

- `apps/ai-dial-admin/src/components/Common/JsonEditorBase/JsonEditorBase.tsx` (new `onBeforeMount` prop)
- `apps/ai-dial-admin/src/constants/editor.ts` (JSONata theme rules, light + dark)
- `apps/ai-dial-admin/src/models/evaluation/test-suite.ts` (`jsonataContent`)
- `apps/ai-dial-admin/src/components/TestSuites/RequestTemplate/RequestTemplate.tsx` (header wiring,
  `showVariablesDoc` / `showAddButton` derivation)
- `apps/ai-dial-admin/src/components/TestSuites/RequestTemplate/tabs/BodyTab.tsx` (3-way branch)
- `apps/ai-dial-admin/src/components/TestSuites/RequestTemplate/components/ContentTypeSelect.tsx` (clear
  `jsonataContent` on content-type change)
- `apps/ai-dial-admin/src/constants/i18n.ts`, `apps/ai-dial-admin/src/locales/en.ts`

**Shared-surface risk (flagged per project rules)**

- `JsonEditorBase` backs roughly a dozen editors across the app. The change is a strictly additive optional
  prop, but it is a shared component — its existing behavior must not shift.
- Monaco language registration is **global to the Monaco singleton**, not per editor instance. Registration
  must be guarded by an id lookup so remounting any editor cannot register `jsonata` twice.
- `EDITOR_THEMES_CONFIG` is shared by every Monaco editor and diff editor, and Monaco matches theme rules by
  **dotted token prefix across all languages**. An un-namespaced `string` or `keyword` rule would restyle the
  JSON and SQL editors. `inherit: false` on both themes means unmatched tokens fall back to plain foreground.

**Dependencies**

None added. `jsonata@^2.2.1`, `monaco-editor@^0.55.1`, and `@monaco-editor/react@^4.7.0` are already
dependencies.

**Backend**

Consumes the `jsonataContent` field on the request-template body from ai-dial-admin-backend. No new endpoint;
the existing test-suite save/read payload carries it.
