## ADDED Requirements

### Requirement: Catalog group contains the six platform entity items

The Catalog group in `MENU_CONFIGURATION` SHALL contain six items — PlatformModels,
PlatformAppRunners, PlatformInterceptors, PlatformRoutes, PlatformRoles, and PlatformKeys — in that
order as the first six entries, each with `isPreview: true` and with the `ApplicationRoute.*` href
matching its entity name.

#### Scenario: All six platform items are present in the Catalog group

- **WHEN** `MENU_CONFIGURATION` is produced with any `FeatureFlags` value
- **THEN** the Catalog group's `items` array contains entries for `MenuI18nKey.PlatformModels`,
  `MenuI18nKey.PlatformAppRunners`, `MenuI18nKey.PlatformInterceptors`, `MenuI18nKey.PlatformRoutes`,
  `MenuI18nKey.PlatformRoles`, and `MenuI18nKey.PlatformKeys`

#### Scenario: Each platform item carries isPreview: true

- **WHEN** the Catalog group items are read from `MENU_CONFIGURATION`
- **THEN** every platform item (PlatformModels through PlatformKeys) has `isPreview: true`

#### Scenario: Platform items are absent from the Assets group

- **WHEN** `MENU_CONFIGURATION` is produced with any `FeatureFlags` value
- **THEN** the Assets group's `items` array does NOT contain entries for `MenuI18nKey.PlatformModels`,
  `MenuI18nKey.PlatformAppRunners`, `MenuI18nKey.PlatformInterceptors`, `MenuI18nKey.PlatformRoutes`,
  `MenuI18nKey.PlatformRoles`, or `MenuI18nKey.PlatformKeys`

### Requirement: Catalog group is marked as preview

The Catalog group entry in `MENU_CONFIGURATION` SHALL have `isPreview: true` at the group level,
consistent with the pattern used by the Analytics group.

#### Scenario: Catalog group carries isPreview: true

- **WHEN** the Catalog group entry is read from `MENU_CONFIGURATION`
- **THEN** its `isPreview` field is `true`

## MODIFIED Requirements

### Requirement: Catalog group is invisible when it has no items

Because `getActualMenuItems` filters out groups with zero items, the Catalog group SHALL not appear in
the rendered sidebar navigation until at least one item is present in its `items` array. After this
change the group contains six platform items and will therefore be visible.

#### Scenario: Non-empty Catalog group is present in the rendered menu

- **WHEN** the Catalog group `items` array is non-empty (contains platform items)
- **AND** `getActualMenuItems` processes the configuration
- **THEN** the Catalog group is included in the returned menu configuration

#### Scenario: Empty Catalog group is absent from the rendered menu

- **WHEN** the Catalog group `items` array is empty
- **AND** `getActualMenuItems` processes the configuration
- **THEN** the Catalog group is not included in the returned menu configuration
