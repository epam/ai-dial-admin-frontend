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
| `Entities/Applications` | `applications` | `Applications` |
| `Entities/Toolsets` | `toolsets` | `Toolsets` |
| `Entities/Interceptors` | `interceptors` | `Interceptors` |
| `Entities/Routes` | `routes` | `Routes` |

### `AiGateway`
Core-direct items (Models, Translators, Routes, App Runners, Catalog Schemas) are hidden by the `catalog` token of `DISABLE_MENU_ITEMS`.

| Area | Route slug | Component folder |
|------|-----------|------------------|
| `AiGateway/Models` | `platform-models` | `Assets/Platform/Models` |
| `AiGateway/Toolsets` | `assets-toolsets` | `Assets/Entities/Toolsets`, `Assets/Platform/Toolsets` |
| `AiGateway/Translators` | `platform-translators` | `Assets/Platform/Translators` |
| `AiGateway/Routes` | `platform-routes` | `Assets/Platform/Routes` |
| `AiGateway/Applications` | `assets-applications` | `Assets/Entities/Apps`, `Assets/Platform/Applications` |
| `AiGateway/AppRunners` | `platform-app-runners` | `Assets/Platform/AppRunners` |
| `AiGateway/CatalogSchemas` | `platform-catalog-schemas` | `Assets/Platform/CatalogSchemas` |

### `Artifacts`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Artifacts/Skills` | `skills` | `Assets/Artifacts/Skills` |
| `Artifacts/Files` | `files` | `Assets/Artifacts/Files`, `Publications/Assets/Files` |
| `Artifacts/Conversations` | `conversations` | `Assets/Artifacts/Conversations` |
| `Artifacts/Prompts` | `prompts` | `Assets/Artifacts/Prompts` |

Shared asset plumbing (`Assets/BaseAssetList`, `Assets/Modals`, `Assets/Resources`, `Assets/ExportAssets`,
`Assets/Header`, `Assets/ObjectAppRoutes`) serves AI Gateway and Artifacts alike — use the parent area
that dominates the change.

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

### `Evaluation`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Evaluation/TestSuites` | `test-suites` | `TestSuites` |
| `Evaluation/Runs` | `runs` | `Runs` |
| `Evaluation/Datasets` | `datasets` | `Datasets` |

### `analytics` (Preview)
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `analytics/Dashboard` | `dashboards` | `Analytics/Usage` |
| `analytics/Queries` | `queries` | `Analytics/Queries`, `Analytics/QueryBuilder` |
| `analytics/Sessions` | `sessions` | `Analytics/SessionsTrace` |
| `analytics/Tables` | `tables` | `Analytics/Tables` |
| `analytics/Pipelines` | `pipelines` | `Analytics/Pipelines` |

### `Governance`
Platform Roles, Keys and Interceptors are Core-direct and hidden by the `catalog` token.

| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Governance/Roles` | `platform-roles` | `Assets/Platform/Roles` |
| `Governance/Keys` | `platform-keys` | `Assets/Platform/Keys` |
| `Governance/FoldersStorage` | `folders-storage` | `FoldersStorage` |
| `Governance/Interceptors` | `platform-interceptors` | `Assets/Platform/Interceptors` |
| `Governance/Approvals` | `publications` (detail tabs: `application-publications`, `toolset-publications`, `prompt-publications`, `file-publications`, `conversation-publications`, `skill-publications`) | `Publications` |

### `Audit` (deprecated group)
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Audit/Dashboard` | `dashboards` | `ActivityAudit` |
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
| `AdminApiAvailability` | — (route guards on all Admin-API routes) | `Menu`, `Content`, `WelcomeView` |
| `ConfigFiles` | — (toggle on the seven entity list views) | `Common/ConfigFilesToggle` |
| `CatalogAvailability` | — (`catalog` token of `DISABLE_MENU_ITEMS` hiding the Core-direct items + dual-bucket root folders) | `Common/FileManager`, `Common/FilePath`, `Menu` |
| `CatalogProperties` | — (catalog schema picker on entity properties) | `CatalogProperties` |

---

## Technical areas (no UI / no route)

For work with no feature home, use a technical area:

| Area | Covers |
|------|--------|
| `api` | Server actions (`src/app/actions`), API routes (`src/app/api/*`), API client (`src/utils/api`) |
| `i18n` | Locales / translations (`src/locales`, `src/constants/i18n`) |
| `config` | App/build/tooling config, deps, lint/format, husky |
| `infra` | CI, scripts, Docker, agent tooling (`.claude`, `.github`, `.cursor`) |
| `openspec` | Specification framework (`openspec/specs`, `openspec/changes`) |
| `theming` | Color tokens, global SCSS, chart/editor palettes (`src/scss`, theme-token consumers across components) |

---

## How to pick an area

Apply in order:

1. **One leaf section** → `Parent/Child` (e.g. `Deployments/Images`). Match by route slug **or** component folder.
2. **Multiple children under one parent** → just `Parent` (e.g. `Deployments`).
3. **Multiple top-level parents** → pick the parent with the **most changes**; use the ticket
   title/description to break ties.
4. **No feature mapping** → a cross-cutting or technical area (`Config`, `api`, `i18n`, `config`, `infra`).

The same rules apply whether the input is a set of changed files (commits) or a spec's subject
(OpenSpec grouping).
