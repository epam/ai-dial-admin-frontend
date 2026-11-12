# Project areas

Canonical **area taxonomy** for this project. One source of truth, reused by:

- **Commit / PR scope** — the `git-commit` skill uses these as the `<area>` in
  `<type>(<area>): <description>`.
- **OpenSpec spec grouping** — use these areas to bucket `openspec/specs/*` capabilities under a
  parent/child area.

The feature areas mirror the app's two-level navigation
(`apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx`). Each child lists its **route slug**
(`app/[lang]/<slug>`) and **component folder** (`src/components/<Folder>`) so a change can be mapped to a
precise area. **If the menu changes, update this file** — this file, not the menu source, is what tools read.

---

## Feature areas (menu → submenu)

Use `Parent/Child` for a single leaf, or just `Parent` when several children change together.

### `Entities` (deprecated group)
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Entities/Models` | `models` | `Models`, `ModelView` |
| `Entities/Applications` | `applications` | `Applications`, `FrameRenderer` |
| `Entities/Toolsets` | `toolsets` | `Toolsets` |
| `Entities/Interceptors` | `interceptors` | `Interceptors` |
| `Entities/Routes` | `routes` | `Routes` |

### `AiGateway`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `AiGateway/Models` | `platform-models` | `Assets/Platform/Models` |
| `AiGateway/Toolsets` | `assets-toolsets` | `Assets/Entities/Toolsets`, `Assets/Platform/Toolsets` |
| `AiGateway/Routers` | `platform-routers` | `Assets/Platform/Routers` |
| `AiGateway/Translators` | `platform-translators` | `Assets/Platform/Translators` |
| `AiGateway/Routes` | `platform-routes` | `Assets/Platform/Routes` |
| `AiGateway/Applications` | `assets-applications` | `Assets/Entities/Apps`, `Assets/Platform/Applications` |
| `AiGateway/AppRunners` | `platform-app-runners` | `Assets/Platform/AppRunners` |
| `AiGateway/CatalogSchemas` | `platform-catalog-schemas` | `Assets/Platform/CatalogSchemas` |

### `Artifacts`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Artifacts/Skills` | `skills` | `Assets/Artifacts/Skills` |
| `Artifacts/Projects` | `projects` | `Assets/Artifacts/Projects` |
| `Artifacts/Files` | `files` | `Assets/Artifacts/Files`, `Publications/Assets/Files` |
| `Artifacts/Conversations` | `conversations` | `Assets/Artifacts/Conversations` |
| `Artifacts/Prompts` | `prompts` | `Assets/Artifacts/Prompts` |

Shared asset plumbing serves AI Gateway and Artifacts alike — use the cross-cutting `Components/Assets` area.

### `Builders` (deprecated group)
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Builders/ApplicationRunners` | `application-runners` | `ApplicationRunners` |
| `Builders/InterceptorTemplates` | `interceptor-templates` | `InterceptorTemplates` |
| `Builders/Adapters` | `adapters` | `Adapter` |

### `AccessManagement` (deprecated group)
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `AccessManagement/Roles` | `roles` | `Roles` |
| `AccessManagement/Keys` | `keys` | `Keys` |

### `Deployments`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Deployments/Servings` | `model-servings` | `Containers`, `Deployments` |
| `Deployments/Containers` | `containers` | `Containers`, `Deployments` |
| `Deployments/Images` | `deployment-images` | `Images`, `Deployments` |

### `Eval`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Eval/TestSuites` | `test-suites` | `TestSuites` |
| `Eval/Runs` | `runs` | `Runs` |
| `Eval/Datasets` | `datasets` | `Datasets` |
| `Eval/Trends` | — (trends tab on model and application views) | `EvalTrendsTab` |

### `Analytics` (Preview)
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Analytics/Dashboards` | `dashboards` (redirect: `dashboard`) | `Analytics/Usage`, `Analytics/CustomDashboards` |
| `Analytics/Queries` | `queries` (redirect: `query-builder`) | `Analytics/Queries`, `Analytics/QueryBuilder` |
| `Analytics/Sessions` | `sessions` | `Analytics/SessionsTrace` |
| `Analytics/Tables` | `tables` | `Analytics/Tables` |
| `Analytics/Pipelines` | `pipelines` | `Analytics/Pipelines` |

Shared analytics plumbing (`Analytics/Common`, `Analytics/EntityTraces`) — use the parent `Analytics`.

### `Governance`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Governance/Roles` | `platform-roles` | `Assets/Platform/Roles` |
| `Governance/Keys` | `platform-keys` | `Assets/Platform/Keys` |
| `Governance/FoldersStorage` | `folders-storage` | `FoldersStorage` |
| `Governance/Interceptors` | `platform-interceptors` | `Assets/Platform/Interceptors` |
| `Governance/Policies` | `platform-policies` | `Assets/Platform/Policies` |
| `Governance/PolicyAssignments` | `platform-policy-assignments` | `Assets/Platform/PolicyAssignments` |
| `Governance/Approvals` | `publications` (detail tabs: `application-publications`, `toolset-publications`, `prompt-publications`, `file-publications`, `conversation-publications`, `skill-publications`) | `Publications` |

### `Audit` (deprecated group)
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Audit/Dashboard` | `dashboards` (redirect: `usage`) | `ActivityAudit`, `Telemetry` |
| `Audit/ActivityAudit` | `activity-audit` | `ActivityAudit` |
| `Audit/UsageLog` | `usage-log` | `UsageLog` |

The Dashboards item exists in both Analytics and Audit; `/dashboards` belongs to whichever group
`menu-configuration.tsx` resolves for the active feature flags.

---

## Cross-cutting feature areas (not in the menu)

| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Config` | `import-config`, `export-config` | `ImportConfig`, `ExportConfig` |
| `SystemProperties` | `system-properties` | `SystemProperties` |
| `Home` | `home` | `WelcomeView` |
| `Components/CatalogProperties` | — (catalog schema picker on entity properties) | `CatalogProperties` |
| `Components/Grid` | — (shared AG Grid wrapper / cell renderers) | `Grid` |
| `Components/Assets` | — (shared building blocks of AI Gateway and Artifacts pages) | `Assets/BaseAssetList`, `Assets/Modals`, `Assets/Resources`, `Assets/ExportAssets`, `Assets/Header`, `Assets/ObjectAppRoutes` |
| `Components/Common` | — (simple shared building blocks) | `Common`, `AddEntitiesTab`, `Defaults`, `IconGallery`, `UpstreamEndpoints` |
| `Components/<Folder>` | — (complex shared component, named after its folder) | `BaseControls`, `EntityHeaderControls`, `EntityListView`, `EntityMainProperties`, `EntityTabs`, `EntityView`, `ListView`, `Rules`, `SourceField`, `Tools` |
| `Components/Notification` | — (toasts raised through `NotificationContext`) | `Notification` |
| `Layout` | — (app shell around every page) | `Content`, `Footer`, `Breadcrumbs`, `SideBar` |
| `Layout/Header` | — (app header) | `Header`, `SettingsModal` |
| `Layout/Menu` | — (navigation menu) | `Menu` |
| `ErrorPages` | — (pages rendered in place of a route: 403, 404, maintenance) | `Page403`, `Page404`, `PageMaintenance` |
| `Auth` | `external-service-signin`, `toolset-signin` | `Toolsets/Auth`, `Assets/Resources` |

---

## Technical areas (no UI / no route)

For work with no feature home, use a technical area:

| Area | Covers |
|------|--------|
| `api` | Server actions (`src/app/actions`), API routes (`src/app/api/*`), API client (`src/utils/api`) |
| `i18n` | Locales / translations (`src/locales`, `src/constants/i18n`) |
| `config` | App/build/tooling config, lint/format, husky |
| `deps` | Dependency bumps (`package.json`, lockfile) |
| `infra` | Scripts, Docker, agent tooling (`.claude`, `.github`, `.cursor`) |
| `ci` | CI workflows (`.github/workflows`) |
| `openspec` | Specification framework (`openspec/specs`, `openspec/changes`) |
| `theming` | Color tokens, global SCSS, chart/editor palettes (`src/scss`, theme-token consumers across components) |

---

## How to pick an area

First decide the **level** of the change — the folder a fix lands in does not decide it:

- **Feature work or a feature bug** — the problem is stated in terms of an app section. Use that
  section's feature area, even when the fix lands in a shared component folder.
- **A component's own behavior** — the problem is stated in terms of the component and holds for every
  consumer. Use `Components/*` (or `Layout*`, `ErrorPages`).

Then apply in order:

1. **One leaf section** → `Parent/Child` (e.g. `Deployments/Images`). Match by route slug **or** component folder.
2. **Multiple children under one parent** → just `Parent` (e.g. `Deployments`).
3. **Multiple top-level parents** → pick the parent with the **most changes**; use the ticket
   title/description to break ties.
4. **No feature mapping** → a cross-cutting or technical area (`Config`, `Components/Common`, `api`, `i18n`, `config`, `deps`, `infra`, `ci`).

The same rules apply whether the input is a set of changed files (commits) or a spec's subject
(OpenSpec grouping).
