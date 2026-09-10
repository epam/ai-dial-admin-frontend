## Context

`ai-dial-core` is adding `Translator` at the same tier as `Model`/`Interceptor`/`Role`/`Route`/`Key` —
`ResourceTypes.TRANSLATOR`, flat, unversioned, bound to `ResourceDescriptor.PLATFORM_BUCKET`, served
through `ConfigResourceController` at `/v1/translators/{bucket}/{path}` and
`/v1/metadata/translators/{bucket}/{path}` (PR
[epam/ai-dial-core#1919](https://github.com/epam/ai-dial-core/pull/1919), `feat/issue-1907`). Its
entity shape, from `config/src/main/java/com/epam/aidial/core/config/Translator.java`:

```java
public class Translator {
    private final InterfaceType in;   // required for a registered entry
    private final InterfaceType out;  // required
    private final String baseUrl;     // required
}
```

`Translator` is a **plain POJO** — unlike `Interceptor`/`Model` (`extends Deployment`) and
`Route`/`Role` (`extends RoleBasedEntity` or plain-with-`Role`-specific fields), it has no `name`
carried on the class itself (the name comes from the blob path, same as every other flat platform
entity), no `userRoles`, no `displayName`/`description`/`endpoint`/`features`. It is the leanest
member of the flat-platform family by a wide margin — 3 fields, no sub-object.

`InterfaceType` (Core) has exactly 4 values (`openaiChatCompletions`, `openaiEmbeddings`,
`openaiResponses`, `anthropicMessages`) and the frontend already carries the same 4 values as
`DeploymentInterfaceType` (`models/dial/interfaces.ts`), used today by `InterfacesField`'s
`allowedTypes` prop on `Assets > Interceptors`/`Assets > Models`. No new enum is needed for `in`/`out`
— this change reuses `DeploymentInterfaceType` directly.

Six flat-platform entities already exist end-to-end: `Models`, `App Runners`, `Interceptors`,
`Routes`, `Roles`, `Keys` — tracked as the `FLAT_PLATFORM_VIEWS` array in `utils/files/root-folder.ts`,
which every shared list/action-map util (`BaseAssetList/utils.tsx`, `Assets/utils.ts`,
`Common/FileManager/utils.ts`, `Assets/Modals/utils.tsx`) keys off. `ResourceType` today is `FILE |
PROMPT | APPLICATION | TOOLSET | CONVERSATION | SKILL | MODEL | APP_TYPE_SCHEMA | INTERCEPTOR | ROLE |
ROUTE | PROJECT_KEY` — no `TRANSLATOR` member, so this is wired from scratch the way `ROUTE` was for
`add-assets-routes`.

The user has directed: place `Translators` in the Catalog menu directly after `Interceptors` (closest
existing sibling — flat, no roles, no cascading references); no Roles tab; reuse
`DeploymentInterfaceType` for the `in`/`out` selects; do not join `READABLE_CONFIG_FILE_TYPES`.

## Goals / Non-Goals

**Goals:**
- Add `ResourceType.TRANSLATOR` and complete its Core-asset wiring end to end (route, resource-type
  registration, `FLAT_PLATFORM_VIEWS`, `PlatformAsset` union), following the `add-assets-routes`
  wiring shape.
- Add a `Catalog ▸ Translators` list + detail view, flat/unversioned like the other six.
- Add the `Translators` menu item directly after `Interceptors`, ahead of `Routes`/`Roles`/`Keys`
  (each shifts one position down).
- Reuse `DeploymentInterfaceType` for `in`/`out`, and the shared `IdControl` for name — no new enum,
  no new name-validation logic.

**Non-Goals:**
- No Roles tab. `Translator` is a plain POJO with no `userRoles` field — there is nothing for a
  membership-editing widget to bind to, unlike `Route`/`Role`/`Key`, which are all `RoleBasedEntity`
  or `Role`-shaped and do have one.
- No Configuration or Features tab — `Translator` isn't a `Deployment`.
- No attach-picker widening. A translator is referenced by name only from a model/interceptor's
  `interfaces.<type>.translator` field — a config-authoring concern this change does not touch (see
  proposal Non-goals) — never from an admin-console entity-attach list the way an interceptor is
  referenced from `Application.interceptors`. There is no `AssetTranslatorOrigin` axis to introduce.
- No client-side structural or cross-reference validation (`in ≠ out`, interface-type membership,
  deployment-serves-`out`-pass-through). Core validates all of it server-side
  (`ConfigPostProcessor.validateTranslator`) and returns a 422 with `validationWarnings`.
- No `READABLE_CONFIG_FILE_TYPES` membership — per user direction, no other picker needs to resolve a
  config-file-declared translator by name through this change.
- No duplicate row action. Unlike `Routes`/`Roles`/`Keys` (which picked this up in later, separate
  changes), this change scopes the list to create/delete/bulk-delete only, matching what the proposal
  states; a duplicate action can follow as its own change if wanted, the same way it did for the
  others.

## Decisions

### D1: Menu placement — directly after Interceptors, not after Keys
Chosen over appending after `Keys` (the naive "last-added" position) because `Interceptors` is the
structurally closest sibling: both are simple, roles-free (well — Interceptors technically has no
Roles tab either, matching this precedent), single-Properties-tab entities with no cascading
reference cleanup on delete. `Routes`/`Roles`/`Keys` each shift one position down in the Catalog
group's `items` array in `menu-configuration.tsx`.

### D2: Wire `ResourceType.TRANSLATOR` from scratch, following `ROUTE`'s pattern
Adds, mirroring `add-assets-routes`' D2:
- `ResourceType.TRANSLATOR = 'TRANSLATOR'` in `types/resource-type.ts`.
- `ApplicationRoute.PlatformTranslators = '/platform-translators'` in `types/routes.ts`, grouped with
  the other `// Platform entities` members.
- `FLAT_PLATFORM_VIEWS` (`utils/files/root-folder.ts`) gains `ApplicationRoute.PlatformTranslators`.
- A `DialTranslatorResource` model in `models/dial/resource.ts`, extending `ModifiedEntity` like
  `DialRouteResource`/`DialRoleResource`/`DialKeyResource`: `name`, `path`, `folderId`, `author?`,
  `status?`, `validationWarnings?`, `in?: DeploymentInterfaceType`, `out?: DeploymentInterfaceType`,
  `baseUrl?: string`. Added to the `PlatformAsset` union.
- `app/[lang]/platform-translators/actions.ts` (`getTranslators`/`createTranslator`/`getTranslator`/
  `updateTranslator`/`removeTranslator`/`bulkDeleteTranslators`), following
  `platform-interceptors/actions.ts`'s shape exactly: `assetApi.put`/`.delete`/`.list`/
  `.getMergedWithEtag` against `ResourceType.TRANSLATOR`. A `toTranslatorPayload` strips `status`/
  `validationWarnings`/`path`/`folderId` before every write — the same list `toInterceptorPayload`
  strips, since `author`/`createdAt`/`updatedAt` are never populated on `DialTranslatorResource` in
  the first place (unlike `Route`, which needed the D7 lesson from `add-assets-routes` because its
  model carried them; this model is scoped tighter from the start).

### D3: Properties tab — `IdControl` + two enum selects + one URL field, no `EntityProperties` dispatch
Following `RouteCreateProperties`'s precedent (`add-assets-routes` D6): `Translator` declares no
`displayName`/`description`, so the create form cannot go through the generic `EntityProperties`
dispatcher branch (it unconditionally renders a `DisplayNameControl` and seeds `description`). A
dedicated `TranslatorCreateProperties.tsx` renders only the shared `IdControl`, wired into
`EntityMainProperties/Properties/Properties.tsx` ahead of `isSimpleEntity`, matching
`RouteCreateProperties`/`RoleCreateProperties`.

The Properties tab (`Assets/Platform/Translators/Properties.tsx`) renders:
- `IdControl`-equivalent read-only name display (via `ResourceInfoHeader`, same as every other
  platform entity's Properties tab).
- Two selects for `in`/`out`, sourced from `DeploymentInterfaceType`. `constants/deployment-interfaces.ts`
  already declares `MODEL_INTERFACE_TYPES` as all four values — `INTERCEPTOR_INTERFACE_TYPES` only
  covers one (`OpenAIChatCompletions`) and isn't reusable here. Reuse `MODEL_INTERFACE_TYPES` directly
  for both selects rather than adding a same-valued `TRANSLATOR_INTERFACE_TYPES` constant.
- A `baseUrl` text field, reusing the same URL-input building block `EndpointControl`/
  `ConfigurationEndpointControl` are built from (plain string, no percent-encoding, no `$id` handling).

### D4: No Roles tab — a structural absence, not a deferral
Unlike `add-assets-routes`' D4 (Route *has* `userRoles` but the tab was deliberately deferred),
`Translator` has no `userRoles` field on Core's class at all — there is no field to defer editing of.
State this as a structural non-goal in the spec (see `specs/platform-translators/spec.md`) rather than
a "deferred, to be revisited" note, so a future reader doesn't mistake it for unfinished work.

### D5: Reuse `DeploymentInterfaceType` verbatim for `in`/`out`
Per user direction. Core's `InterfaceType` and the frontend's `DeploymentInterfaceType` already carry
the same 4 values 1:1 (`openaiChatCompletions`, `openaiResponses`, `anthropicMessages`,
`openaiEmbeddings`) — introducing a second, translator-specific enum would just duplicate that list
with no behavioral difference. The same drift risk `InterfacesField`'s existing consumers already
carry (a newer Core adding a 5th interface type before the frontend enum catches up) applies here too,
and is accepted the same way: Core's own `InterfaceType.find` degrades a name it doesn't know to
`null` rather than erroring, so an unrecognized value round-trips as an unselected option rather than
crashing the form.

### D6: No duplicate action, no attach-picker widening
Both explicitly out of scope for this change (see Non-Goals) — kept out to match what was scoped with
the user, rather than opportunistically added because the shared `DuplicatePlatformAsset` modal would
technically support a name-only entity. Either can follow as a separate, focused change later, the way
`catalog-keys-duplicate-action` and `redesign-platform-asset-roles` did for Keys/Roles.

## Risks / Trade-offs

- **Core PR #1919 is not yet merged** → accepted per user direction (expected to merge without shape
  changes); if it merges with a different field name or an added required field, the model/actions/
  Properties tab need a follow-up fix, the same category of risk every change ahead of an upstream
  merge carries.
- **`Translator`'s server-side validation error shape is unverified from the frontend side** — no
  existing asset surface has exercised `ConfigPostProcessor.validateTranslator`'s specific
  `validationWarnings` field names → mitigated the same way `add-assets-routes`/`add-assets-roles`
  mitigated the equivalent risk for `Route.class`/`Role.class`: surface Core's `errorMessage`/
  `validationWarnings` verbatim rather than adding client-side guessing.
- **`in`/`out` sharing an enum with `InterfacesField`'s existing consumers means a future divergence
  between "interfaces a deployment can expose" and "interfaces a translator can convert between"
  would need a second enum retrofitted later** → accepted; no such divergence exists in Core today
  (`Translator.in`/`out` and `Deployment.interfaces`' keys are typed against the exact same
  `InterfaceType` enum on the Core side), so introducing a second frontend enum now would be
  speculative.

## Open Questions

None outstanding — every question raised during exploration (menu placement, `in`/`out` source enum,
config-file readability, Roles tab) was resolved by explicit user direction, captured in the Decisions
above.
