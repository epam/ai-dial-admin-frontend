import { DATE_FIELD_TYPES, UNTAGGED_SPAN_FIELD_TAG } from '@/src/constants/analytics/sessions-trace';
import {
  EnrichmentDefinition,
  SessionDetailRow,
  SessionEnrichmentPanel,
  SessionInsightField,
  SessionInsightsState,
  SpanFieldGroup,
  SpanFieldTag,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { columnHeaderName, enrichmentOf, unqualified } from '@/src/utils/analytics/session-enrichment';
import { readableWords } from '@/src/utils/analytics/session-formatting';
import { isSpanFieldEmpty } from '@/src/utils/analytics/session-span-fields';
import { enrichmentNamespacesOf, ratingEnrichmentOf } from '@/src/utils/analytics/sessions-source';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

// Which columns an enrichment panel presents, read off the entity's own schema rather than a list held here.
// An enrichment is provisioned per instance and its evaluator supersedes its own columns, so a list would be
// wrong in both directions at once: blind to a column that was added, and still naming one that was replaced
// and now comes back null.
//
// Sensitive columns need no test: the detail query may not name one at all, so none can reach a row.
const SUMMARY_FIELD = 'summary';

export const enrichmentColumnsOf = (namespace: string, fields: AnalyticsEntityField[] = []): SessionInsightField[] =>
  fields
    .filter((field) => enrichmentOf(field.name) === namespace)
    .map((field) => ({
      name: field.name,
      label: columnHeaderName(field),
      hint: field.description,
      type: field.type,
      ...(field.tag ? { tag: field.tag } : {}),
    }));

export const groupFieldsByTag = (fields: SessionInsightField[], tagOrder: string[] = []): SpanFieldGroup[] => {
  const byTag = new Map<string, SpanFieldGroup['fields']>();

  for (const field of fields) {
    const tag = field.tag || UNTAGGED_SPAN_FIELD_TAG;
    const descriptor = {
      name: field.name,
      label: field.label,
      type: field.type,
      tag,
      ...(field.hint ? { description: field.hint } : {}),
    };
    byTag.set(tag, [...(byTag.get(tag) ?? []), descriptor]);
  }

  const declared = tagOrder.filter((tag) => tag !== SpanFieldTag.System && byTag.has(tag));
  const rest = [...byTag.keys()].filter((tag) => tag !== SpanFieldTag.System && !declared.includes(tag));
  const system = byTag.has(SpanFieldTag.System) ? [SpanFieldTag.System] : [];

  return [...declared, ...rest, ...system].map((tag) => ({ tag, fields: byTag.get(tag) ?? [] }));
};

export const enrichmentPanelsOf = (
  fields: AnalyticsEntityField[] = [],
  definitions: Record<string, EnrichmentDefinition> = {},
  headingField: string | null = null,
): SessionEnrichmentPanel[] => {
  const rating = ratingEnrichmentOf(fields);

  return enrichmentNamespacesOf(fields)
    .filter((namespace) => namespace !== rating)
    .map((namespace) => {
      const columns = enrichmentColumnsOf(namespace, fields);
      const definition = definitions[namespace];
      const summary = columns.find(({ name }) => unqualified(name) === SUMMARY_FIELD);
      const grouped = columns.filter(({ name }) => name !== headingField && name !== summary?.name);

      return {
        namespace,
        title: namespace,
        ...(definition?.description ? { description: definition.description } : {}),
        ...(summary ? { summary } : {}),
        fields: columns,
        groups: groupFieldsByTag(grouped, definition?.tagOrder),
      };
    })
    .filter(({ fields: columns }) => columns.length > 0);
};

export const enrichmentSummaryText = (record: SessionDetailRow, panel: SessionEnrichmentPanel): string =>
  panel.summary ? insightValueText(record, panel.summary) : '';

// The text one insight column renders as, empty where the record carries no value for it.
//
// Formatting follows the **declared type**, never the field name, so a column the service newly types is
// rendered correctly with no change here. A plain string is rendered as recorded even when it looks like a
// machine token: rewriting on the shape of a value rather than on its declared type would silently edit
// legitimate content — a file name, an identifier, a model name.
export const insightValueText = (record: SessionDetailRow, { name, type }: SessionInsightField): string => {
  const raw = record[name as keyof SessionDetailRow];

  if (raw == null || raw === '') {
    return '';
  }
  if (DATE_FIELD_TYPES.includes(type)) {
    return formatDateTimeToLocalString(raw as number | string);
  }
  if (type === AnalyticsFieldType.Enum) {
    return readableWords(String(raw));
  }

  return String(raw);
};

const hasValue = (record: SessionDetailRow, name: string): boolean =>
  !isSpanFieldEmpty(record[name as keyof SessionDetailRow] as unknown, '');

// Three states, decided over the enrichment's namespace as a whole rather than over any one field.
//
// The service returns every projected column in every row, so a name the row does not carry at all was
// never projected — this deployment does not expose the enrichment. Keys present with nothing in them is a
// session the evaluator has not reached. The two read differently to an operator, which is why they
// are not collapsed.
//
// Keying this on the title, as it once was, made the panel's existence depend on that one column still
// existing, and reported a session whose title alone was blank as one the evaluator never saw.
export const sessionInsightsState = (
  record: SessionDetailRow,
  columns: SessionInsightField[],
): SessionInsightsState => {
  const projected = columns.filter(({ name }) => record[name as keyof SessionDetailRow] !== undefined);

  if (!projected.length) {
    return SessionInsightsState.EnrichmentUnavailable;
  }

  return projected.some(({ name }) => hasValue(record, name))
    ? SessionInsightsState.Available
    : SessionInsightsState.NotEvaluated;
};
