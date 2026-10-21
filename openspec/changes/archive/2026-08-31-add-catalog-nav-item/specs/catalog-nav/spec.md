## ADDED Requirements

### Requirement: Catalog group exists in menu configuration

The left-navigation `MENU_CONFIGURATION` SHALL include a Catalog group entry at index 2 (after Builders, before Assets), identified by `MenuI18nKey.Catalog` as its key and `MenuI18nKey.CatalogDescription` as its description key, and rendered with `IconBook2` from `@tabler/icons-react`.

#### Scenario: Catalog group is declared at the correct position

- **WHEN** `MENU_CONFIGURATION` is produced with any `FeatureFlags` value
- **THEN** the Catalog group entry is present in the configuration array
- **AND** it appears after the Builders group and before the Assets group

#### Scenario: Catalog group carries the correct i18n keys

- **WHEN** the Catalog group entry is read from `MENU_CONFIGURATION`
- **THEN** its `key` is `MenuI18nKey.Catalog`
- **AND** its `descriptionKey` is `MenuI18nKey.CatalogDescription`

### Requirement: Catalog group is invisible when it has no items

Because `getActualMenuItems` filters out groups with zero items, the Catalog group SHALL not appear in the rendered sidebar navigation until at least one item is present in its `items` array.

#### Scenario: Empty Catalog group is absent from the rendered menu

- **WHEN** the Catalog group `items` array is empty
- **AND** `getActualMenuItems` processes the configuration
- **THEN** the Catalog group is not included in the returned menu configuration

### Requirement: Catalog group has English translations

The `src/locales/en.ts` file SHALL include translations for `MenuI18nKey.Catalog` and `MenuI18nKey.CatalogDescription` so the group label and description render correctly in English.

#### Scenario: English translations are defined for the Catalog group

- **WHEN** the English locale file is loaded
- **THEN** the translation key corresponding to `MenuI18nKey.Catalog` resolves to a non-empty string
- **AND** the translation key corresponding to `MenuI18nKey.CatalogDescription` resolves to a non-empty string
