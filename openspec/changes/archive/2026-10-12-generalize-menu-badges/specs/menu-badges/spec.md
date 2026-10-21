## ADDED Requirements

### Requirement: Menu entries carry at most one typed badge

Each left-navigation menu group and menu item SHALL declare its badge through a single optional `badge`
field whose value is a `MenuBadge` (`Preview` or `Deprecated`). An entry with no `badge` SHALL render no
badge. The legacy boolean `isPreview` SHALL NOT exist.

#### Scenario: Entry without a badge
- **WHEN** a menu group or item has no `badge`
- **THEN** no badge is rendered for it

#### Scenario: One badge per entry
- **WHEN** a menu group or item declares a `badge`
- **THEN** exactly one badge, matching that value, is rendered for it

### Requirement: Badge appearance per type

A `Preview` badge SHALL render with the label `Basic.Preview` in the blue filled style. A `Deprecated`
badge SHALL render with the label `Basic.Deprecated` in the brown filled style. Both SHALL be produced by
one shared menu badge component keyed by the `MenuBadge` value.

#### Scenario: Preview badge
- **WHEN** an entry's `badge` is `MenuBadge.Preview`
- **THEN** a badge labelled with the `Basic.Preview` key renders in the blue filled style

#### Scenario: Deprecated badge
- **WHEN** an entry's `badge` is `MenuBadge.Deprecated`
- **THEN** a badge labelled with the `Basic.Deprecated` key renders in the brown filled style

### Requirement: Badges render only in the expanded sidebar

A badge SHALL be shown only while the sidebar is expanded. A group header SHALL show its badge at the
trailing edge of the header row, and a menu item SHALL show its badge at the trailing edge of its link.
A collapsed sidebar SHALL show no badge.

#### Scenario: Expanded sidebar
- **WHEN** the sidebar is expanded and a group has a `badge`
- **THEN** the badge appears in that group's header row

#### Scenario: Collapsed sidebar
- **WHEN** the sidebar is collapsed
- **THEN** no badge is rendered for any group or item

### Requirement: Legacy admin groups are marked Deprecated

The Entities, Builders, Access Management, and Audit groups SHALL have `badge: MenuBadge.Deprecated` on
the group header. Their items SHALL NOT carry a badge. The Analytics group SHALL have
`badge: MenuBadge.Preview`. No other group SHALL declare a badge. Visibility of these groups is unchanged
and remains governed by `menu-group-visibility`.

#### Scenario: Deprecated groups
- **WHEN** the menu configuration is built with `featureFlags.adminApiEnabled` `true`
- **THEN** the Entities, Builders, Access Management, and Audit groups each have `badge` equal to
  `MenuBadge.Deprecated`
- **AND** none of their items has a `badge`

#### Scenario: Analytics group stays Preview
- **WHEN** the menu configuration is built with `featureFlags.analyticsEnabled` `true`
- **THEN** the Analytics group has `badge` equal to `MenuBadge.Preview`

#### Scenario: Other groups carry no badge
- **WHEN** the menu configuration is built with every feature flag enabled
- **THEN** the AI Gateway, Artifacts, Deployments, Evaluation, and Governance groups have no `badge`

#### Scenario: Hidden group shows no badge
- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **THEN** the Entities, Builders, Access Management, and Audit groups are absent, so no Deprecated badge
  appears
