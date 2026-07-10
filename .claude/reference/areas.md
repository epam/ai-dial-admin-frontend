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

### `Entities`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Entities/Models` | `models` | `Models`, `ModelView` |
| `Entities/Applications` | `applications` | `Applications` |
| `Entities/Toolsets` | `toolsets` | `Toolsets` |
| `Entities/Interceptors` | `interceptors` | `Interceptors` |
| `Entities/Routes` | `routes` | `Routes` |

### `Builders`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Builders/ApplicationRunners` | `application-runners` | `ApplicationRunners` |
| `Builders/InterceptorTemplates` | `interceptor-templates` | `InterceptorTemplates` |
| `Builders/Adapters` | `adapters` | `Adapter` |

### `Assets`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Assets/Applications` | `assets-applications` | `Assets` |
| `Assets/Toolsets` | `assets-toolsets` | `Assets` |
| `Assets/Prompts` | `prompts` | `Assets` |
| `Assets/Conversations` | `conversations` | `Assets` |
| `Assets/Files` | `files` | `Assets`, `Publications/Assets/Files` |

### `Deployments`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Deployments/ModelServings` | `model-servings` | `Deployments`, `Containers` |
| `Deployments/McpContainers` | `mcp-containers` | `Deployments`, `Containers` |
| `Deployments/InterceptorContainers` | `interceptor-containers` | `Deployments`, `Containers` |
| `Deployments/AdapterContainers` | `adapter-containers` | `Deployments`, `Containers` |
| `Deployments/ApplicationContainers` | `application-containers` | `Deployments`, `Containers` |
| `Deployments/Images` | `deployment-images` | `Images` |

### `AccessManagement`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `AccessManagement/Roles` | `roles` | `Roles` |
| `AccessManagement/Keys` | `keys` | `Keys` |
| `AccessManagement/FoldersStorage` | `folders-storage` | `FoldersStorage` |

### `Approvals`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Approvals/ApplicationPublications` | `application-publications` | `Publications` |
| `Approvals/ToolsetPublications` | `toolset-publications` | `Publications` |
| `Approvals/PromptPublications` | `prompt-publications` | `Publications` |
| `Approvals/FilePublications` | `file-publications` | `Publications` |
| `Approvals/ConversationPublications` | `conversation-publications` | `Publications` |

### `Evaluation`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Evaluation/TestSuites` | `test-suites` | `TestSuites` |
| `Evaluation/Datasets` | `datasets` | `Datasets` |
| `Evaluation/Runs` | `runs` | `Runs` |
| `Evaluation/Playground` | `playground` | `Playground` |

### `Audit`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Audit/Dashboard` | `dashboard` | `ActivityAudit` |
| `Audit/ActivityAudit` | `activity-audit` | `ActivityAudit` |
| `Audit/UsageLog` | `usage-log` | `UsageLog` |

### `analytics`
| Area | Route slug | Component folder |
|------|-----------|------------------|
| `analytics/QueryBuilder` | `query-builder` | `Analytics` |
| `analytics/Tables` | `tables` | `Analytics` |

---

## Cross-cutting feature areas (not in the menu)

| Area | Route slug | Component folder |
|------|-----------|------------------|
| `Config` | `import-config`, `export-config` | `ImportConfig`, `ExportConfig` |
| `SystemProperties` | `system-properties` | `SystemProperties` |
| `Home` | `home` | `WelcomeView` |

---

## Technical areas (no UI / no route)

For work with no feature home, use a technical area:

| Area | Covers |
|------|--------|
| `api` | Server actions (`src/app/actions`), API routes (`src/app/api/*`), API client (`src/utils/api`) |
| `i18n` | Locales / translations (`src/locales`, `src/constants/i18n`) |
| `config` | App/build/tooling config, deps, lint/format, husky |
| `infra` | CI, scripts, Docker, agent tooling (`.claude`, `.github`, `.cursor`) |

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
