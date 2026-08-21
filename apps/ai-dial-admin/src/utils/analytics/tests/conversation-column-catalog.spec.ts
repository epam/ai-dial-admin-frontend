import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { CONVERSATIONS_TRACE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ConversationColumn, ConversationsField, UsageLogField } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  availableSelectFields,
  filterableColumnFields,
  projectableSchemaFields,
  sortableColumnFields,
  transcriptBodyFields,
} from '@/src/utils/analytics/conversation-column-catalog';
import { OPTIONAL_USAGE_LOG_FIELDS } from '@/src/constants/analytics/conversations-trace';

const t = (key: string) => key;

// A plain column of the entity's own table reports its flat name as its source; an enrichment column's name
// is namespaced while its source stays bare. That inequality is the whole test for "needs a join".
const sourceField = (name: string): AnalyticsEntityField => ({ name, source: name, type: AnalyticsFieldType.String });

const enrichmentField = (name: string): AnalyticsEntityField => ({
  name: `conversation_insights.${name}`,
  source: name,
  type: AnalyticsFieldType.String,
});

const SCHEMA: AnalyticsEntityField[] = [
  ...[
    'chat_id',
    'project_id',
    'user_hash',
    'turn_count',
    'first_request_time',
    'last_request_time',
    'total_tokens',
    'total_price',
    'deployments',
  ].map(sourceField),
  ...['title', 'topics', 'sentiment', 'model'].map(enrichmentField),
];

const curated = (schemaFields: AnalyticsEntityField[] = SCHEMA): ColDef[] =>
  CONVERSATIONS_TRACE_COLUMNS(t, schemaFields);

describe('projectableSchemaFields', () => {
  // With no derived catalog left, the projection is exactly what the curated columns read. A field the entity
  // carries but no column reads is not fetched — the grid offers nothing for it, so nothing would render it.
  test('projects the fields the curated set reads, and nothing else', () => {
    const { sourceBacked, enrichmentBacked, requiredEnrichment } = projectableSchemaFields(curated(), SCHEMA);
    const projected = [...sourceBacked, ...enrichmentBacked, ...requiredEnrichment];

    expect(projected).toContain(ConversationsField.ChatId);
    expect(projected).toContain(ConversationsField.TotalPrice);
    expect(projected).not.toContain('conversation_insights.sentiment');
    expect(projected).not.toContain('conversation_insights.model');
  });

  // A composed cell reads a field no column of its own is named for, so membership cannot be read off the
  // column list alone: the activity cell needs the first activity to state a span.
  test('projects a field a composed cell reads without a column of its own', () => {
    expect(projectableSchemaFields(curated(), SCHEMA).sourceBacked).toContain(ConversationsField.FirstRequestTime);
  });

  // Rating is composed from the feedback lookups and has no field on this entity, so schema membership
  // excludes it without an exclusion list to maintain.
  test('excludes the composed rating column, which reads no field of this entity', () => {
    const { sourceBacked, enrichmentBacked, requiredEnrichment } = projectableSchemaFields(curated(), SCHEMA);

    expect([...sourceBacked, ...enrichmentBacked, ...requiredEnrichment]).not.toContain(ConversationColumn.Rating);
  });

  // A source field is a plain column of the table already being read, so revealing its column costs nothing.
  // An enrichment field drags its enrichment's join in, so it is projected only while its column is visible.
  test('splits by what projecting the field costs, not by whether its column is visible', () => {
    const { sourceBacked, enrichmentBacked } = projectableSchemaFields(curated(), SCHEMA);

    expect(sourceBacked).toContain(ConversationsField.Deployments);
    expect(enrichmentBacked).toEqual([ConversationsField.InsightTopics]);
  });

  // The identity column cannot be hidden, so there is no visibility for its enrichment field to follow: the
  // join is paid on every page, which is the cost of naming a conversation by anything but its id.
  test('projects the identity column title unconditionally, with no column of its own', () => {
    const { requiredEnrichment, enrichmentBacked } = projectableSchemaFields(curated(), SCHEMA);

    expect(requiredEnrichment).toEqual([ConversationsField.InsightTitle]);
    expect(enrichmentBacked).not.toContain(ConversationsField.InsightTitle);
  });

  test('names nothing an instance does not report', () => {
    const withoutInsights = SCHEMA.filter((field) => !field.name.startsWith('conversation_insights.'));
    const { enrichmentBacked, requiredEnrichment } = projectableSchemaFields(curated(withoutInsights), withoutInsights);

    expect(enrichmentBacked).toEqual([]);
    expect(requiredEnrichment).toEqual([]);
  });

  test('projects nothing at all without a schema, since no field can be confirmed to exist', () => {
    const { sourceBacked, enrichmentBacked, requiredEnrichment } = projectableSchemaFields(curated([]), []);

    expect([...sourceBacked, ...enrichmentBacked, ...requiredEnrichment]).toEqual([]);
  });
});

// Both lists derive from the column set, which has already dropped any column whose field the instance does
// not report — so the schema gate is structural rather than a second list to keep in step. A hand-held list
// would drift the moment a column is dropped, and the service rejects the *whole* query for one unknown
// field, so the failure would be the page rather than the control.
describe('sortableColumnFields / filterableColumnFields', () => {
  test('offer only what the rendered columns declare', () => {
    expect(sortableColumnFields(curated())).toEqual([
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TurnCount,
      ConversationsField.LastRequestTime,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
    ]);
    expect(filterableColumnFields(curated())).toContain(ConversationsField.InsightTopics);
    expect(filterableColumnFields(curated())).not.toContain(ConversationsField.LastRequestTime);
  });

  test('drop an enrichment predicate the instance cannot answer', () => {
    const withoutInsights = SCHEMA.filter((field) => !field.name.startsWith('conversation_insights.'));

    expect(filterableColumnFields(curated(withoutInsights))).not.toContain(ConversationsField.InsightTopics);
  });
});

describe('availableSelectFields', () => {
  const ordered = ['chat_id', 'total_price', 'conversation_insights.title', 'traces'];
  const optional = ['conversation_insights.title', 'traces'];

  test('names an optional field only where the schema reports it', () => {
    expect(availableSelectFields(ordered, optional, ['chat_id', 'total_price', 'conversation_insights.title'])).toEqual(
      ['chat_id', 'total_price', 'conversation_insights.title'],
    );
  });

  test('names the required core alone when the schema could not be read', () => {
    expect(availableSelectFields(ordered, optional, undefined)).toEqual(['chat_id', 'total_price']);
  });

  test('keeps the caller ordering, since the select is read positionally', () => {
    expect(availableSelectFields(ordered, optional, ['traces', 'chat_id', 'total_price'])).toEqual([
      'chat_id',
      'total_price',
      'traces',
    ]);
  });
});

// Two unrelated conditions remove a body column from the fetched schema, and both look identical here: the
// `sensitive` flag hides all three from a caller below FULL_ADMIN, while `assembled_response` is simply not
// persisted by an instance predating it — missing for every caller, full administrators included.
describe('transcriptBodyFields', () => {
  const ALL = [UsageLogField.RequestBody, UsageLogField.ResponseBody, UsageLogField.AssembledResponse];

  test('reads a transcript when the request body and both response columns are reported', () => {
    expect(transcriptBodyFields(ALL)).toEqual({
      isReadable: true,
      responseFields: [UsageLogField.AssembledResponse, UsageLogField.ResponseBody],
    });
  });

  // The service-version case: an older instance carries no assembled column at all, and the decoder over the
  // raw body is the only path. The Chat view still works.
  test('reads a transcript from the raw body alone when the assembled column is absent', () => {
    expect(transcriptBodyFields([UsageLogField.RequestBody, UsageLogField.ResponseBody])).toEqual({
      isReadable: true,
      responseFields: [UsageLogField.ResponseBody],
    });
  });

  test('prefers the assembled column when it is the only response column reported', () => {
    expect(transcriptBodyFields([UsageLogField.RequestBody, UsageLogField.AssembledResponse])).toEqual({
      isReadable: true,
      responseFields: [UsageLogField.AssembledResponse],
    });
  });

  // The access case: `sensitive` takes all three at once, which is why the request body going missing is the
  // reliable signal that this is a rights problem rather than a version one.
  test('reads no transcript when the schema reports none of them', () => {
    expect(transcriptBodyFields([UsageLogField.ChatId, UsageLogField.TraceId])).toEqual({
      isReadable: false,
      responseFields: [],
    });
  });

  test('reads no transcript without the request body, whatever the response columns say', () => {
    expect(transcriptBodyFields([UsageLogField.ResponseBody, UsageLogField.AssembledResponse])).toEqual({
      isReadable: false,
      responseFields: [UsageLogField.AssembledResponse, UsageLogField.ResponseBody],
    });
  });

  test('reads no transcript when the request body is reported but no response column is', () => {
    expect(transcriptBodyFields([UsageLogField.RequestBody])).toEqual({ isReadable: false, responseFields: [] });
  });

  test('reads no transcript from an unread schema', () => {
    expect(transcriptBodyFields()).toEqual({ isReadable: false, responseFields: [] });
  });
});

// The gate that protects a full administrator: naming a column the instance does not persist is a 400 on the
// whole query, and no permission changes that.
describe('the hop log optional-field list', () => {
  const ordered = [UsageLogField.TraceId, UsageLogField.RequestBody, UsageLogField.AssembledResponse];

  test('names the assembled column where the schema reports it', () => {
    expect(availableSelectFields(ordered, OPTIONAL_USAGE_LOG_FIELDS, [...ordered])).toEqual(ordered);
  });

  test('omits the assembled column where the schema does not, keeping every required field', () => {
    expect(
      availableSelectFields(ordered, OPTIONAL_USAGE_LOG_FIELDS, [UsageLogField.TraceId, UsageLogField.RequestBody]),
    ).toEqual([UsageLogField.TraceId, UsageLogField.RequestBody]);
  });

  test('names the required fields only when the schema could not be read', () => {
    expect(availableSelectFields(ordered, OPTIONAL_USAGE_LOG_FIELDS, undefined)).toEqual([
      UsageLogField.TraceId,
      UsageLogField.RequestBody,
    ]);
  });

  // An instance can persist one body column without the other, and the gate accepts either — so neither may
  // be named unconditionally. Naming `response_body` regardless broke the whole Chat view on an instance
  // that reports only the assembled column.
  test('treats both body columns as optional hop-log fields', () => {
    expect(OPTIONAL_USAGE_LOG_FIELDS).toEqual([UsageLogField.AssembledResponse, UsageLogField.ResponseBody]);
  });

  test('omits the raw response column where the schema reports only the assembled one', () => {
    const bodyFields = [UsageLogField.RequestBody, UsageLogField.ResponseBody, UsageLogField.AssembledResponse];

    expect(
      availableSelectFields(bodyFields, OPTIONAL_USAGE_LOG_FIELDS, [
        UsageLogField.RequestBody,
        UsageLogField.AssembledResponse,
      ]),
    ).toEqual([UsageLogField.RequestBody, UsageLogField.AssembledResponse]);
  });
});
