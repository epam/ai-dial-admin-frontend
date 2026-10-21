## Why

The six recently-added platform entity routes (`assets-models`, `assets-interceptors`, `assets-routes`, `assets-roles`, `assets-keys`, `assets-app-runners`) use the `assets-` prefix, but so do the public-bucket user resources (`assets-applications`, `assets-toolsets`). When Applications and Toolsets are migrated to platform entities, their natural route names (`platform-applications`, `platform-toolsets`) cannot follow the established pattern because `assets-applications` and `assets-toolsets` already exist as distinct, versioned-resource routes — creating a permanent naming collision and conceptual ambiguity in the codebase.

## What Changes

- **RENAME** the six World-B (platform-bucket, flat) entity routes from `assets-*` to `platform-*`:
  - `assets-models` → `platform-models`
  - `assets-app-runners` → `platform-app-runners`
  - `assets-interceptors` → `platform-interceptors`
  - `assets-routes` → `platform-routes`
  - `assets-roles` → `platform-roles`
  - `assets-keys` → `platform-keys`
- **UPDATE** all references: `ApplicationRoute` enum values and member names (`AssetsModels` → `PlatformModels`, etc.), i18n enum members and translation keys (`Menu.AssetsModels` → `Menu.PlatformModels`, etc.), sidebar nav, breadcrumbs, view predicates (`isFlatPlatformView`, `isAssetView` set membership), and all switch/case/map/array entries across ~100 files.
- **RENAME** the six Next.js app directory folders under `src/app/[lang]/` to match the new routes.
- **RENAME** the six corresponding OpenSpec spec directories from `specs/assets-*/` to `specs/platform-*/`.
- **FIX** two pre-existing inconsistencies uncovered by the rename scope: add a dedicated `Menu.PlatformAppRunners` i18n key (currently `assets-app-runners` incorrectly reuses the config-entity `Menu.AppRunners` key), and add the missing `PlatformKeys` entry to `listViewTitleMap` in `ListView/constants.ts`.

No user-visible behavior changes. URLs change (old routes are not preserved), which is acceptable for an admin-internal tool.

## Non-Goals

- Renaming component directories (`components/Assets/Models/` etc.) — the component tree is internal and structurally fine as-is.
- Migrating Applications or Toolsets as platform entities — that is the next change; this rename is a prerequisite.
- Renaming anything in the World-C public-resource routes (`assets-applications`, `assets-toolsets`, `assets-skills`, etc.).

## Capabilities

### New Capabilities

*(none — this is a pure rename/refactoring with no new behavior)*

### Modified Capabilities

*(no requirement changes — the specs for the renamed capabilities describe identical behavior under new paths)*

## Impact

- **~100 files** across `src/types/`, `src/constants/`, `src/locales/`, `src/app/[lang]/`, `src/components/`, `src/utils/`, `src/context/`, and `src/server/` — all mechanical string substitutions.
- **6 OpenSpec spec directories** renamed from `openspec/specs/assets-*/` to `openspec/specs/platform-*/`.
- **No API changes** — backend routes and Core bucket names are unaffected.
- **URLs change** — admin users with bookmarks to `/assets-models`, `/assets-interceptors`, etc. will need to update them.
