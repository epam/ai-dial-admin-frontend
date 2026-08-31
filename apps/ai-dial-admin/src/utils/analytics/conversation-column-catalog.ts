import { ColDef } from 'ag-grid-community';

import { dateTimeColumn, numericColumn } from '@/src/constants/grid-columns/configs';
import { baseNumberFilter, baseStringFilter } from '@/src/constants/grid-columns/filters';
import {
  ANALYTICS_FIELD_QUERY_VALUE_TYPE,
  COMPOSED_COLUMN_PROVENANCE,
  CONVERSATION_FIELD_VALUE_TYPE,
  CONVERSATION_VALUE_FILTER,
  CURATED_COMPOSED_FIELDS,
  DATE_FIELD_TYPES,
  ENRICHMENT_PROVENANCE,
  IDENTITY_ENRICHMENT_FIELDS,
  NON_SCALAR_FIELD_TYPES,
  NUMERIC_FIELD_TYPES,
  TRANSCRIPT_REQUIRED_FIELD,
  TRANSCRIPT_RESPONSE_FIELDS,
} from '@/src/constants/analytics/conversations-trace';
import {
  ColumnProvenance,
  ConversationColumnGroup,
  ConversationProjectableFields,
  ProvenanceEntity,
  TranscriptBodyFields,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';
import { readableWords } from '@/src/utils/analytics/conversation-formatting';

const ENRICHMENT_SEPARATOR = '.';

const UNFILTERABLE: Partial<ColDef> = { filter: false, floatingFilter: false };

// Every stored field the given columns read: the field behind each column, plus the fields a composed column
// reads without having a column of its own.
const consumedFields = (columns: ColDef[]): Set<string> =>
  new Set<string>([...columns.map((column) => column.field as string), ...CURATED_COMPOSED_FIELDS]);

// A plain column of the entity's own source reports its flat name as the field backing it, so the two are
// equal. Anything the service supplies through an enrichment is namespaced by that enrichment, leaving the
// backing name unqualified — `session_insights.title` sources `title`. The inequality therefore reads
// as "not a plain column of the table the query already reads", which also covers a JSON-derived field:
// likewise not free to project, and likewise better fetched on demand.
const isSourceBacked = (field: AnalyticsEntityField): boolean => field.name === field.source;

// The namespace an enrichment field carries, empty for a plain column of the rollup. Read off the name
// rather than from a list, so an enrichment this frontend has never heard of is still attributed.
const enrichmentOf = (fieldName: string): string => {
  const separator = fieldName.indexOf(ENRICHMENT_SEPARATOR);
  return separator > 0 ? fieldName.slice(0, separator) : '';
};

// An enrichment this frontend cannot name takes the unattributed colour rather than a fourth hue. Shared
// with `columnProvenance` so the provenance line and the grid band attribute a namespace identically.
const enrichmentProvenance = (enrichment: string): ColumnProvenance =>
  ENRICHMENT_PROVENANCE[enrichment] ?? ColumnProvenance.Other;

export const composedSourceEntities = (
  baseEntity: string,
  fields: AnalyticsEntityField[] = [],
  queriedEntities: ProvenanceEntity[] = [],
): ProvenanceEntity[] => {
  const namespaces: string[] = [];

  fields.forEach((field) => {
    const enrichment = enrichmentOf(field.name);
    if (enrichment && !namespaces.includes(enrichment)) {
      namespaces.push(enrichment);
    }
  });

  // An entity can reach here twice: the day ratings arrive as an enrichment, the schema reports the
  // namespace while the queried list still names the table. Naming it once keeps the line honest and the
  // rendered keys unique — and the declared attribution wins, because the derived one falls back to the
  // unattributed colour for any namespace this frontend cannot name, which would paint the line grey while
  // the grid band paints the same source amber.
  const declared = new Map(queriedEntities.map((entity) => [entity.name, entity]));

  const entities: ProvenanceEntity[] = [
    { name: baseEntity, provenance: ColumnProvenance.Conversations },
    ...namespaces.map((name) => declared.get(name) ?? { name, provenance: enrichmentProvenance(name) }),
    ...queriedEntities,
  ];

  const seen = new Set<string>();

  return entities.filter((entity) => {
    if (seen.has(entity.name)) {
      return false;
    }
    seen.add(entity.name);
    return true;
  });
};

export const columnProvenance = (fieldName: string): ColumnProvenance => {
  const composed = COMPOSED_COLUMN_PROVENANCE[fieldName];
  if (composed) {
    return composed;
  }

  const enrichment = enrichmentOf(fieldName);
  if (!enrichment) {
    return ColumnProvenance.Conversations;
  }

  return enrichmentProvenance(enrichment);
};

// `heavy` is deliberately not a test here: it is a transfer-cost hint, and it governs whether a field is
// projected on visibility rather than whether it is offered at all. Withholding the column instead would
// hide a field the operator can legitimately ask for, at no saving — nothing is transferred for a column
// nobody reveals.
const isOfferable = (field: AnalyticsEntityField, consumed: Set<string>): boolean =>
  !field.sensitive && !NON_SCALAR_FIELD_TYPES.includes(field.type) && !consumed.has(field.name);

export const offerableSchemaFields = (curated: ColDef[], fields: AnalyticsEntityField[] = []): string[] => {
  const consumed = consumedFields(curated);

  return fields.filter((field) => isOfferable(field, consumed)).map((field) => field.name);
};

// Membership in the schema is the test, so the composed Rating column — which has no field on this entity —
// falls out without an exclusion list to maintain, and so does a curated field an instance does not carry.
//
// `heavySource` comes back empty against the real schema, and that is the expected result rather than a gap.
// The reason is not that `traces` is an array: the array test governs whether a field is derived into a
// column, never whether it is projected — `deployments` is an array too, has a hand-written column, and is
// projected on every page like any other cheap source field. `traces` falls out because nothing rendered
// reads it, so no column's field set names it.
//
// Two things populate this bucket, neither of which needs anyone to revisit the decision:
//   1. the schema marks a scalar field `heavy` — set service-side, per field, so no frontend change at all;
//   2. a column is added that reads `traces`, hand-written the way `deployments` is.
// The second is what the 5.39 MiB measurement is about: without the bucket that column would be projected on
// every page of every scroll, and the cost would be found by an operator rather than here.
export const projectableSchemaFields = (
  columns: ColDef[],
  fields: AnalyticsEntityField[] = [],
): ConversationProjectableFields => {
  const rendered = consumedFields(columns);
  const projectable = fields.filter((field) => rendered.has(field.name));

  const required = new Set<string>(IDENTITY_ENRICHMENT_FIELDS);
  const source = projectable.filter(isSourceBacked);
  const enrichment = projectable.filter((field) => !isSourceBacked(field));

  return {
    cheapSource: source.filter((field) => !field.heavy).map((field) => field.name),
    heavySource: source.filter((field) => field.heavy).map((field) => field.name),
    enrichment: enrichment.filter((field) => !required.has(field.name)).map((field) => field.name),
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

// A derived column takes its formatting from the declared type, but it offers a filter only for the types
// the grid's filter translation actually carries — string and numeric, whose models are `filter`/`filterTo`.
//
// A date column would bind `agDateColumnFilter`, whose model carries `dateFrom`/`dateTo` instead, so
// `translateConversationFilterModel` reads nothing and drops the entry: the header would show an active
// filter over an unnarrowed result, which is worse than offering none. A boolean column would fall through
// to the text filter and offer `contains`, which the query language cannot express over a boolean — and the
// service rejects the whole query for one bad predicate, so a filter menu could take the listing down.
//
// Both stay sortable: ordering is expressible for either, and it is the predicate that has no translation.
//
// An `enum` field binds the value filter instead of either, and no floating filter: the default one is a text
// entry and would write a text model over a value model. Enum-ness comes from the declared type alone — a
// field an instance begins reporting as an enum gets the control with no change here.
const typeColumn = (type: AnalyticsFieldType): Partial<ColDef> => {
  if (NUMERIC_FIELD_TYPES.includes(type)) {
    return { ...numericColumn, ...baseNumberFilter };
  }
  if (type === AnalyticsFieldType.Enum) {
    return { filter: CONVERSATION_VALUE_FILTER, floatingFilter: false };
  }
  if (DATE_FIELD_TYPES.includes(type)) {
    return { ...dateTimeColumn, ...UNFILTERABLE };
  }
  if (type === AnalyticsFieldType.Boolean) {
    return UNFILTERABLE;
  }
  return { ...baseStringFilter };
};

// The service omits `display_name` where it is null — on some fields, and on some instances on all of them —
// so the fallback is an ordinary path, not an edge case, and it may not present a raw catalog identifier as a
// header. The namespace is dropped because the column's group already names it.
export const columnHeaderName = (field: AnalyticsEntityField): string => {
  if (field.display_name) {
    return field.display_name;
  }

  return readableWords(field.name.slice(field.name.indexOf(ENRICHMENT_SEPARATOR) + 1));
};

// The description is the service's own, quoted rather than paraphrased: two of them contradict what their
// column looks like — `duration_ms` counts a chained turn's nested hops more than once, `chain_price_total`
// is NULL where no turn starts a chain — so a paraphrase would be a second copy of a caveat, drifting.
//
// No column is offered for a request or response body, and none can be: those are columns of
// `dial_usage_log`, while this grid derives from `conversations`, whose schema reports no body field. There
// is deliberately no filter against those names — one would imply the schema could report them, and would
// still be here long after anyone remembered why.
const toCatalogColumn = (field: AnalyticsEntityField): ColDef => ({
  field: field.name,
  headerName: columnHeaderName(field),
  ...(field.description ? { headerTooltip: field.description } : {}),
  ...typeColumn(field.type),
  minWidth: 140,
  flex: 1,
  hide: true,
});

export const buildConversationColumnCatalog = (curated: ColDef[], fields: AnalyticsEntityField[] = []): ColDef[] => {
  const offerable = new Set(offerableSchemaFields(curated, fields));

  return [...curated, ...fields.filter((field) => offerable.has(field.name)).map(toCatalogColumn)];
};

// Groups keyed on the pair of origin and tag, in the order the columns themselves appear, so the curated
// columns keep their relative order and a group's position follows its first column.
export const conversationColumnGroups = (
  catalog: ColDef[],
  fields: AnalyticsEntityField[] = [],
): ConversationColumnGroup[] => {
  const tagByField = new Map(fields.map((field) => [field.name, field.tag ?? '']));
  const groups: ConversationColumnGroup[] = [];

  catalog.forEach((column) => {
    const fieldName = column.field as string;
    const provenance = columnProvenance(fieldName);
    const source = enrichmentOf(fieldName);
    const tag = tagByField.get(fieldName) ?? '';
    // Keyed on the source too, not just the origin: every enrichment this frontend cannot name shares the
    // one `Other` origin, so two of them carrying the same tag would otherwise merge into a single group
    // labelled after whichever appeared first — the mis-attribution the pair key exists to prevent. For the
    // rollup the source is empty, so this changes nothing there.
    const existing = groups.find(
      (group) => group.provenance === provenance && group.source === source && group.tag === tag,
    );

    if (existing) {
      existing.fields.push(fieldName);
      return;
    }

    groups.push({ provenance, source, tag, fields: [fieldName] });
  });

  return groups;
};

export const catalogValueTypes = (fields: AnalyticsEntityField[] = []): Record<string, QueryValueType> => {
  const types = { ...CONVERSATION_FIELD_VALUE_TYPE } as Record<string, QueryValueType>;

  fields.forEach((field) => {
    const valueType = ANALYTICS_FIELD_QUERY_VALUE_TYPE[field.type];
    if (valueType) {
      types[field.name] = valueType;
    }
  });

  return types;
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

// The hop-log body columns are `sensitive` in the ADAS catalog, so they are absent from the fetched schema
// below FULL_ADMIN — and the service rejects the whole query for one unknown field.
export const transcriptBodyFields = (schemaFieldNames: string[] = []): TranscriptBodyFields => {
  const available = new Set(schemaFieldNames);
  const responseFields = TRANSCRIPT_RESPONSE_FIELDS.filter((name) => available.has(name));

  return {
    isReadable: available.has(TRANSCRIPT_REQUIRED_FIELD) && responseFields.length > 0,
    responseFields,
  };
};
