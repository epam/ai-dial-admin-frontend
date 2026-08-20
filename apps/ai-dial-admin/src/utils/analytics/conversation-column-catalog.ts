import { ColDef } from 'ag-grid-community';

import { CURATED_COMPOSED_FIELDS, IDENTITY_ENRICHMENT_FIELDS } from '@/src/constants/analytics/conversations-trace';
import { ConversationProjectableFields } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

// Every stored field the curated column set reads: the field behind each column, plus the fields a composed
// column reads without having a field of its own. The grid offers nothing beyond this set, so this is also
// the whole of what the list query may project.
const curatedFields = (curated: ColDef[]): Set<string> =>
  new Set<string>([...curated.map((column) => column.field as string), ...CURATED_COMPOSED_FIELDS]);

// A plain column of the entity's own source reports its flat name as the field backing it, so the two are
// equal. Anything the service supplies through an enrichment is namespaced by that enrichment, leaving the
// backing name unqualified — `conversation_insights.title` sources `title`. The inequality therefore reads
// as "not a plain column of the table the query already reads", which also covers a JSON-derived field:
// likewise not free to project, and likewise better fetched on demand.
const isSourceBacked = (field: AnalyticsEntityField): boolean => field.name === field.source;

export const projectableSchemaFields = (
  curated: ColDef[],
  fields: AnalyticsEntityField[] = [],
): ConversationProjectableFields => {
  const consumed = curatedFields(curated);
  // Membership in the schema is the test, so the composed Rating column — which has no field on this entity —
  // falls out without an exclusion list to maintain, and so does a curated field an instance does not carry.
  const projectable = fields.filter((field) => consumed.has(field.name));

  const required = new Set<string>(IDENTITY_ENRICHMENT_FIELDS);
  const enrichment = projectable.filter((field) => !isSourceBacked(field));

  return {
    sourceBacked: projectable.filter(isSourceBacked).map((field) => field.name),
    enrichmentBacked: enrichment.filter((field) => !required.has(field.name)).map((field) => field.name),
    requiredEnrichment: enrichment.filter((field) => required.has(field.name)).map((field) => field.name),
  };
};

// The service rejects a whole query that names one field its entity does not carry, and the rollups are
// catalog objects provisioned per instance rather than shipped with the service — so an instance can carry
// an older field set than this frontend knows. A field beyond the view's required core is therefore named
// only when the fetched schema reports it. With no schema in hand the required core is all that is named:
// a failed schema fetch is not evidence that an optional field exists, and guessing costs every row.
export const availableSelectFields = (ordered: string[], optional: string[], schemaFieldNames?: string[]): string[] => {
  const isOptional = new Set(optional);
  const available = new Set(schemaFieldNames ?? []);

  return ordered.filter((name) => !isOptional.has(name) || available.has(name));
};

// Both allow-lists are derived from the column set rather than held independently of it, and that column set
// has already dropped any column whose field this instance does not report. The gate is therefore structural:
// a predicate or an ordering can only name a field some rendered column reads. A hand-maintained list would
// drift the moment a column is dropped for a lagging instance, and the service rejects the *whole* query for
// one unknown field — so the failure would be the page, not the control.
export const sortableColumnFields = (columns: ColDef[]): string[] =>
  columns.filter((column) => column.sortable !== false && column.field).map((column) => column.field as string);

export const filterableColumnFields = (columns: ColDef[]): string[] =>
  columns.filter((column) => column.filter !== false && column.field).map((column) => column.field as string);
