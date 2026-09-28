import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { readableWords } from '@/src/utils/analytics/session-formatting';

// The service exposes an enrichment's columns under a qualified flat name — `session_insights.title` — so a
// dot in a reported field name separates the enrichment that supplies the column from the column itself.
const ENRICHMENT_SEPARATOR = '.';

// The namespace an enrichment field carries, empty for a plain column of the rollup. Read off the name
// rather than from a list, so an enrichment this frontend has never heard of is still attributed.
export const enrichmentOf = (fieldName: string): string => {
  const separator = fieldName.indexOf(ENRICHMENT_SEPARATOR);
  return separator > 0 ? fieldName.slice(0, separator) : '';
};

// The column's own name, with the enrichment that supplies it dropped. The pair to `enrichmentOf`, and it
// answers the boundary the same way: a leading dot names no enrichment, so such a field is its own column
// name rather than a nameless one. A read
// selects an enrichment column under its qualified name and states it under this one, so a row keyed by the
// column is not re-keyed by where the column happens to live.
export const unqualified = (fieldName: string): string => {
  const separator = fieldName.indexOf(ENRICHMENT_SEPARATOR);

  return separator > 0 ? fieldName.slice(separator + 1) : fieldName;
};

// The service omits `display_name` where it is null — on some fields, and on some instances on all of them —
// so the fallback is an ordinary path, not an edge case, and it may not present a raw catalog identifier as a
// label. The namespace is dropped because whatever renders the field already names its source.
//
// Shared by the grid's column catalog and the detail view's insights panel so that one field cannot be
// labelled two ways depending on where it is read.
export const columnHeaderName = (field: AnalyticsEntityField): string => {
  if (field.display_name) {
    return field.display_name;
  }

  return readableWords(unqualified(field.name));
};
