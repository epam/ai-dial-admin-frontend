## Why

An undeclared-properties warning can grow until it hides the Catalog Metadata editor (#5418). In Catalog Schemas, a widget presentation hint can be selected but not cleared (#5419), even though Core permits it to be omitted.

## What Changes

- Bound the undeclared-properties message height and allow scrolling while preserving all names and the existing removal action. Follow the existing bounded notification pattern.
- Offer a localized `- None -` option in the Widget selection. Choosing it removes the widget hint and returns the field to its empty placeholder; other metadata stays intact.
- Cover the behavior with tests, including save and reopen, without changing widget values or validation rules.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `catalog-properties-editing`: Keep long undeclared-properties warnings and errors contained without losing their full contents or removal control.
- `platform-catalog-schemas`: Allow an optional widget hint to be cleared alongside the eight supported values.

## Non-goals

- Truncating or changing stored catalog values, redesigning other notifications, or changing the separate validation-error list.
- Changing Core's catalog meta-schema or inventing a default widget.

## Impact

- The shared Catalog Metadata editor is used by models, interceptors, applications, and toolsets; its banner's warning and error variants both need to remain functional.
- The shared schema grid hosts the Widget column; the clear option is limited to that column. Its shared select renderer supplies an empty controlled value for all single-select consumers. Existing schema serialization and deletion are reused.
- No API or dependency changes are expected. Preserve the unrelated existing edit in `CatalogPropertiesEditor.tsx`.
