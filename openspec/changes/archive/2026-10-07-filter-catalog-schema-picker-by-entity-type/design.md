## Context

A catalog schema declares `dial:catalogEntityType`. DIAL Core's catalog meta-schema
(`config/src/main/resources/catalog-schemas/schema.json`) allows five values and `required`s the
field: `model`, `agent`, `toolset`, `skill`, `interceptor`.

Two console surfaces read that field, and until now both treated it as presentational:

- The deployment schema picker (`CatalogSchemaField` + `SelectCatalogSchemaModal`) listed every
  schema Core resolves and showed the declared kind as a third grid column.
- The catalog schema's own Properties tab (`CreateProperties`) offered all five values for editing.

Issue #4880 is the cautionary tale sitting directly under this change. `CatalogEntityType` had been
narrowed to three values as collateral in an unrelated commit. Because `CATALOG_ENTITY_TYPES` is
`Object.values` of that enum and feeds *both* the entity-type selection and the save gate in
`src/utils/catalog-schemas/validation.ts`, narrowing the offered list silently narrowed the accepted
list too. A configuration file could legally declare a schema typed `skill`; the console opened it
and then refused every save with "Entity type must be one of model, agent, toolset". The schema
became permanently unsaveable through the console.

This change removes `skill` from what the console offers. Done naively — by editing the enum again —
it would reintroduce #4880 exactly.

## Goals / Non-Goals

**Goals:**

- Filter the deployment schema picker to the kind of deployment being edited.
- Keep every schema reachable through the picker despite the filter.
- Stop offering `skill` as an entity type for a new or edited catalog schema.
- Keep the save gate at Core's five values, so no legally-typed schema becomes unsaveable.
- Make the offered/accepted split self-documenting, so a later tidy-up cannot silently merge it.

**Non-Goals:**

- Change `src/utils/catalog-schemas/validation.ts`. It is left byte-for-byte alone.
- Change `CatalogEntityType` or `CATALOG_ENTITY_TYPES`. Both stay Core's five.
- Enforce a kind match on save, on the deployment or on the schema. Core does not, so neither do we.
- Change how Core lists schemas, or add a server-side filter. The option read is unchanged and still
  returns the full set; the filter is a client concern because the escape hatch has to be able to
  show everything without a second request.

## Decisions

### Separate what the console offers from what it accepts

Two constants in `src/constants/catalog-schemas.ts`, each documenting which side it serves and why
they differ, each naming Issue #4880:

- `CATALOG_ENTITY_TYPES` — Core's five, unchanged, `Object.values(CatalogEntityType)`. This is the
  **accept** list, consumed by the save gate.
- `OFFERED_CATALOG_ENTITY_TYPES` — the four the console **offers** for authoring: `model`, `agent`,
  `toolset`, `interceptor`.

The two are deliberately not derived from one another. `OFFERED_CATALOG_ENTITY_TYPES` is spelled out
as its own literal list rather than as `CATALOG_ENTITY_TYPES.filter(...)`, so that a future change to
Core's enum does not silently change what the console offers, and so that each list reads as an
independent decision rather than one as a view of the other.

**Alternatives considered:**

- *Remove `Skill` from the enum.* This is precisely the #4880 regression. Rejected.
- *Derive the offered list by filtering the accepted list.* Compact, but it makes the offered list a
  function of Core's list, so adding a sixth value to Core's meta-schema would start offering it
  without anyone deciding to. The coupling runs the wrong way.
- *Keep one list and filter at the one call site in `CreateProperties`.* The distinction would live
  in a component rather than beside the constant it qualifies, which is where someone looking for it
  would read "offers exactly these" and tidy the two back together.

### A schema already typed outside the offered set keeps its kind visible

The entity-type selection is `required`, and its value comes from the schema being edited. A schema
typed `skill` would otherwise render a blank required field: its kind would look missing, and
touching the control would discard it. So the selection offers the four, **plus** whatever kind the
schema already declares when that falls outside them.

This keeps the #4880 guarantee honest end to end. The schema stays saveable *and* legible, not merely
saveable. It is the same rule the picker applies to the currently-selected schema, for the same
reason: a value already in the data is never hidden from the control that edits it.

### The picker filter is one pure function

`src/utils/catalog-schemas/picker-options.ts` exports
`filterCatalogSchemaOptionsByEntityType(options, entityType, selectedId)`. Both the dropdown in
`CatalogSchemaField` and the grid in `SelectCatalogSchemaModal` call it, so the two halves of one
picker cannot disagree about what is listed.

A schema survives the filter when any of these holds:

- Its declared kind equals the deployment's kind — the point of the filter.
- It declares **no** kind. `CatalogSchemaOption['dial:catalogEntityType']` is optional and nullable
  because Core's listing copies the field unconditionally, so a schema without one arrives as
  `null`. Hiding those would make a legal configuration unreachable.
- Its `$id` is the one the deployment currently points at. Hiding the current selection would make
  the field show a value its own list denies.

With no `entityType` the function returns its input unchanged, so a surface that has not opted in
behaves exactly as before.

### The escape hatch lives in the modal, not in the dropdown

`SelectCatalogSchemaModal` owns a `showAll` toggle, a `DialCheckbox` above the grid. Unchecked —
the default — the grid shows the filtered set; checked, it shows everything Core resolved.

The escape hatch answers the objection the superseded requirement raised: Core never checks a
deployment's kind against the schema's, so a cross-kind pairing is legal and our UI must not refuse
it. One affordance in one place is enough to keep it reachable; duplicating it into the inline
dropdown would put the same decision in two controls that can disagree.

`DialCheckbox` is a 1.0 component the ui-kit now supersedes with 2.0 `Checkbox`. It is used here
anyway, because this modal is built entirely from 1.0 (`DialFormPopup`, `DialNeutralButton`,
`DialSelectField`) and the nearest sibling — `ExportConfig/Preview/PreviewModal` — puts a
`DialCheckbox` in a `DialFormPopup` in exactly this position. Matching the sibling keeps the modal
visually coherent; a lone 2.0 control inside a 1.0 popup would not.

### Columns follow the view

In the filtered view the kind column is a constant, so it carries no information and is dropped. The
grid keeps two columns: the schema's `$id` and its `dial:catalogDisplayName`.

Both are kept deliberately. `$id` is a URI and display names are not unique, so `$id` is what tells
two same-named schemas apart; `dial:catalogDisplayName` is the only human-readable label. Reducing
the grid to `$id` alone would leave an administrator matching URIs by eye.

The "show all" view restores the kind column, where it varies and is the reason to be in that view at
all. `CATALOG_SCHEMA_PICKER_COLUMNS` keeps its current three-column shape and serves the "show all"
view; a new `CATALOG_SCHEMA_PICKER_FILTERED_COLUMNS` serves the filtered one.

### The surface-to-kind mapping has one home

`CATALOG_SCHEMA_PICKER_ENTITY_TYPE` in `src/constants/catalog-schemas.ts` maps each deployment
surface to the kind its picker filters to. The four Properties components name a member of it rather
than spelling a `CatalogEntityType` inline.

Applications map to `agent`, not `application`. Core's meta-schema has no `application` value, and
this is the one pairing in the set where the console's own vocabulary and Core's differ — which is
the reason the mapping is a named constant with that note on it rather than four inline literals.

Keying the map by `ApplicationRoute` was considered and rejected: several routes reach the same
Properties component (an asset application is editable from `/applications`,
`/assets-applications`, and the platform applications view), so the map would need an entry per route
and a missing one would silently mean "no filter" — a filter that quietly stops filtering is worse
than none.

## Risks / Trade-offs

- **An administrator may not notice the filter.** A model's picker showing three rows where it used
  to show thirty looks like a failed read. Mitigated by the "show all" control being visible in the
  modal, unchecked, with a label naming what it does — the filter is stated by the control that
  relaxes it.
- **The filter is client-side**, so the full option set still crosses the wire. This is deliberate:
  "show all" must not need a second request, and the read is already one request for every surface.
- **`OFFERED_CATALOG_ENTITY_TYPES` can drift from Core's meta-schema** if Core adds a sixth kind,
  since it is an independent literal. Accepted, and preferred to the opposite failure: the accept
  list stays derived from the enum, so a new Core value is accepted on save immediately and only
  becomes *offerable* when someone decides it should be.
