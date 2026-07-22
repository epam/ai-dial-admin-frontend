## Why

DIAL core (0.46.0) and the admin-backend already support a per-deployment `interfaces` map — an alternative to the legacy single `endpoint` field that lets a Model, Application, or Interceptor expose one or more typed routes (`openaiChatCompletions`, `openaiResponses`, `anthropicMessages`), each with its own `base_url`. The admin frontend has no UI for it at all today (confirmed: zero references to `interfaces`/`anthropicMessages`/`openaiChatCompletions` in `apps/ai-dial-admin/src`), so admins configuring Anthropic Messages routing or multi-interface models currently have no way to do it through the UI. See [issue #3837](https://github.com/epam/ai-dial-admin-frontend/issues/3837).

## What Changes

- Add a new **Interfaces** section (title + bordered container) to the property views of:
  - Entities → Models (up to 3 types: `openaiChatCompletions`, `openaiResponses`, `anthropicMessages`)
  - Entities → Applications (1 type only: `openaiChatCompletions`)
  - Entities → Interceptors (1 type only: `openaiChatCompletions`)
  - Assets → Applications (1 type only: `openaiChatCompletions`, core-backed DTO)
  - Explicitly **out of scope**: Assets → Toolsets/Prompts and any `externalServices`-related UI (already handled elsewhere).
- New "+ Add" interaction:
  - Views with more than one allowed type (Models): clicking **+ Add** opens a dropdown of interface types not yet configured; picking one collapses the dropdown into a labeled `base_url` input for that type. The **+ Add** button is hidden once every allowed type has been added.
  - Views with exactly one allowed type (Applications, Interceptors, Assets-Applications): **+ Add** creates the single allowed input directly — no dropdown is ever shown. The button disappears once that one input exists.
- Each configured interface row shows a red `IconTrashX` delete button that removes that row.
- On save, interface entries with an empty/blank `base_url` are stripped from the payload before it is sent, so reloading the entity after a partial/empty entry doesn't show a stale empty row.
- New generic reusable component (not nested inside the existing `SourceField`/`Endpoints` dispatcher — a separate, sibling component) parameterized by the allowed-type list and per-type labels, so all four views share the same interaction logic while each supplies its own allowed types and field-name casing (camelCase `baseUrl` for admin-backend-backed views, snake_case `base_url` for the core-backed Assets → Applications view).

## Capabilities

### New Capabilities
- `deployment-interfaces-config`: adds the `Interfaces` section UI (add/remove typed interface entries, type restrictions per entity kind, empty-value stripping on save) across Models, Applications (entity), Interceptors, and Assets → Applications.

### Modified Capabilities
(none — this is new UI and new model fields, no existing spec's documented requirements change)

## Impact

- **New models/types**: `interfaces` field added to `DialModel` (`models/dial/model.ts`), `DialApplication` (`models/dial/application.ts`), `DialInterceptor` (`models/dial/interceptor.ts`), and `DialApplicationResource` (`models/dial/resource.ts`).
- **New component**: a generic "typed add-list" component (working name `InterfacesField`) under a shared location (e.g. `components/Common/` or a dedicated `components/InterfacesField/` folder — to be decided in design), plus small usage wrappers in each of the four Properties views:
  - `components/ModelView/ModelProperties/ModelProperties.tsx`
  - `components/Applications/View/Properties/Properties.tsx`
  - `components/Interceptors/View/Properties/Properties.tsx`
  - `components/Assets/Apps/Properties.tsx`
- **Server actions** (payload stripping of empty `base_url` entries before persisting):
  - `app/[lang]/models/actions.ts` (`updateModel`, `createModel`)
  - `app/[lang]/applications/actions.ts` (`updateApplication`, `createApplication`)
  - `app/[lang]/interceptors/actions.ts` (`updateInterceptor`, `createInterceptor`)
  - `app/[lang]/assets-applications/actions.ts` (`updateApp`, `createApp`) — following the existing `stripExternalServiceAuthStatuses` precedent.
- **i18n**: new keys for the section title, per-type field labels, and delete/add button labels in `constants/i18n.ts` / `locales/en.ts`.
- **No breaking changes**: `interfaces` is a new optional field everywhere; existing entities without it are unaffected.
