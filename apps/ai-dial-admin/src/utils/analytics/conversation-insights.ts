import {
  DATE_FIELD_TYPES,
  INSIGHTS_ENRICHMENT,
  NON_SCALAR_FIELD_TYPES,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationDetailRow,
  ConversationInsightField,
  ConversationInsightsState,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { columnHeaderName, enrichmentOf } from '@/src/utils/analytics/conversation-enrichment';
import { readableWords } from '@/src/utils/analytics/conversation-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

// Which columns the insights panel presents, read off the entity's own schema rather than a list held here.
// The enrichment is provisioned per instance and the evaluator supersedes its own columns, so a list would
// be wrong in both directions at once: blind to a column that was added, and still naming one that was
// replaced and now comes back null.
//
// A column the panel could not render as a value is dropped — one the schema types as an object or an
// array. The test is the declared type, so a column newly typed that way falls out with no change here.
// Sensitive columns need no test: the detail query may not name one at all, so none can reach a row.
export const insightColumnsOf = (fields: AnalyticsEntityField[] = []): ConversationInsightField[] =>
  fields
    .filter((field) => enrichmentOf(field.name) === INSIGHTS_ENRICHMENT && !NON_SCALAR_FIELD_TYPES.includes(field.type))
    .map((field) => ({
      name: field.name,
      label: columnHeaderName(field),
      hint: field.description,
      type: field.type,
    }));

// The text one insight column renders as, empty where the record carries no value for it.
//
// Formatting follows the **declared type**, never the field name, so a column the service newly types is
// rendered correctly with no change here. A plain string is rendered as recorded even when it looks like a
// machine token: rewriting on the shape of a value rather than on its declared type would silently edit
// legitimate content — a file name, an identifier, a model name.
export const insightValueText = (record: ConversationDetailRow, { name, type }: ConversationInsightField): string => {
  const raw = record[name as keyof ConversationDetailRow];

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

const hasValue = (record: ConversationDetailRow, name: string): boolean => {
  const raw = record[name as keyof ConversationDetailRow];

  return raw != null && raw !== '';
};

// Three states, decided over the enrichment's namespace as a whole rather than over any one field.
//
// The service returns every projected column in every row, so a name the row does not carry at all was
// never projected — this deployment does not expose the enrichment. Keys present with nothing in them is a
// conversation the evaluator has not reached. The two read differently to an operator, which is why they
// are not collapsed.
//
// Keying this on the title, as it once was, made the panel's existence depend on that one column still
// existing, and reported a conversation whose title alone was blank as one the evaluator never saw.
export const conversationInsightsState = (
  record: ConversationDetailRow,
  columns: ConversationInsightField[],
): ConversationInsightsState => {
  const projected = columns.filter(({ name }) => record[name as keyof ConversationDetailRow] !== undefined);

  if (!projected.length) {
    return ConversationInsightsState.EnrichmentUnavailable;
  }

  return projected.some(({ name }) => hasValue(record, name))
    ? ConversationInsightsState.Available
    : ConversationInsightsState.NotEvaluated;
};
