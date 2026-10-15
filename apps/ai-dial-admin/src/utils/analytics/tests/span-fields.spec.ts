import { describe, expect, test } from 'vitest';

import {
  HOP_REQUEST_BODY_FIELD,
  HOP_RESPONSE_BODY_FIELDS,
  SPAN_BASE_FIELDS,
  SPAN_UNREADABLE_FIELDS,
  UNTAGGED_SPAN_FIELD_TAG,
} from '@/src/constants/analytics/sessions-trace';
import { SpanFieldTag, UsageLogField } from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { sessionFields, spanFields } from '@/src/utils/analytics/session-column-catalog';

const schemaField = (overrides: Partial<AnalyticsEntityField> & { name: string }): AnalyticsEntityField => ({
  type: AnalyticsFieldType.String,
  source: overrides.name,
  ...overrides,
});

// The columns the service publishes to every caller, whatever their role: the base projection has to be
// resolvable out of this alone.
const NON_SENSITIVE_SCHEMA: AnalyticsEntityField[] = SPAN_BASE_FIELDS.map((name) => schemaField({ name }));

describe('spanFields', () => {
  test('names the base projection plus every other column the schema reports', () => {
    const { names } = spanFields([
      ...NON_SENSITIVE_SCHEMA,
      schemaField({ name: 'usage_client_identity.client_type', tag: SpanFieldTag.Client }),
    ]);

    for (const base of SPAN_BASE_FIELDS) {
      expect(names).toContain(base);
    }
    expect(names).toContain('usage_client_identity.client_type');
  });

  test('names each column once when the schema reports one the base list already carries', () => {
    const { names } = spanFields(NON_SENSITIVE_SCHEMA);

    expect(names).toHaveLength(new Set(names).size);
    expect(names).toHaveLength(SPAN_BASE_FIELDS.length);
  });

  test('names no heavy column, and puts none in a group', () => {
    const { names, groups } = spanFields([
      ...NON_SENSITIVE_SCHEMA,
      schemaField({ name: HOP_REQUEST_BODY_FIELD, heavy: true, tag: SpanFieldTag.Request }),
      ...HOP_RESPONSE_BODY_FIELDS.map((name) => schemaField({ name, heavy: true, tag: SpanFieldTag.Response })),
    ]);
    const grouped = groups.flatMap(({ fields }) => fields.map(({ name }) => name));

    for (const body of [HOP_REQUEST_BODY_FIELD, ...HOP_RESPONSE_BODY_FIELDS]) {
      expect(names).not.toContain(body);
      expect(grouped).not.toContain(body);
    }
  });

  // A sensitive column is absent from the schema below full administrator, and naming an absent column
  // rejects the whole read — so the resolver may never add one back.
  test('names nothing the schema omits', () => {
    const { names } = spanFields([schemaField({ name: UsageLogField.CoreSpanId })]);

    expect(names).not.toContain('usage_client_identity.user_email');
    expect(names).not.toContain('dial_usage_log_payload.jwt_claims');
  });

  // The invariant a local stack cannot prove: the sensitive gate fails open with security disabled, so a
  // sensitive column slipping into the base list would break only for non-administrators, in production.
  test('resolves the whole base projection out of a schema carrying no sensitive column', () => {
    const { names } = spanFields(NON_SENSITIVE_SCHEMA);

    expect(names).toEqual(SPAN_BASE_FIELDS);
  });

  test('groups by the schema tag, in the order the schema reports the fields', () => {
    const { groups } = spanFields([
      schemaField({ name: 'core_span_id', tag: SpanFieldTag.Identifier }),
      schemaField({ name: 'usage_client_identity.client_type', tag: SpanFieldTag.Client }),
      schemaField({ name: 'event_id', tag: SpanFieldTag.Identifier }),
    ]);

    expect(groups.map(({ tag }) => tag)).toEqual([SpanFieldTag.Identifier, SpanFieldTag.Client]);
    expect(groups[0].fields.map(({ name }) => name)).toEqual(['core_span_id', 'event_id']);
  });

  test('puts an untagged column in the untagged group', () => {
    const { groups } = spanFields([schemaField({ name: 'event_id' })]);

    expect(groups).toEqual([
      {
        tag: UNTAGGED_SPAN_FIELD_TAG,
        fields: [
          { name: 'event_id', label: 'Event id', type: AnalyticsFieldType.String, tag: UNTAGGED_SPAN_FIELD_TAG },
        ],
      },
    ]);
  });

  test("describes a field with the service's own label and type", () => {
    const { groups } = spanFields([
      schemaField({
        name: 'usage_client_identity.client_type',
        display_name: 'Client type',
        description: 'Client that originated the request.',
        type: AnalyticsFieldType.Enum,
        tag: SpanFieldTag.Client,
      }),
    ]);

    // The description is not among them: the rail states a field as a label over its value, and nothing else.
    expect(groups[0].fields[0]).toEqual({
      name: 'usage_client_identity.client_type',
      label: 'Client type',
      type: AnalyticsFieldType.Enum,
      tag: SpanFieldTag.Client,
    });
  });

  // Everything the schema reports is in a group, headline columns included: the rail states some of them
  // above the groups as well.
  test('groups every reported column, including the ones the rail states above the groups', () => {
    const headline = [UsageLogField.RequestTime, UsageLogField.TotalPrice, UsageLogField.RequestUri];
    const { groups } = spanFields(headline.map((name) => schemaField({ name, tag: SpanFieldTag.Request })));
    const grouped = groups.flatMap(({ fields }) => fields.map(({ name }) => name));

    expect(grouped).toEqual(headline);
  });

  // Non-nullable, so an event with no baggage row reads it as the epoch — a date under a "request time"
  // label that no reader can act on.
  test('omits the baggage copy of the request time by name', () => {
    const { groups } = spanFields(
      SPAN_UNREADABLE_FIELDS.map((name) => schemaField({ name, tag: SpanFieldTag.Provenance })),
    );

    expect(groups).toEqual([]);
  });

  // The figures and addresses the tree states are in their groups too: the rail is the record of the hop,
  // and a reader looking for its status or its duration should not have to know which surface owns it.
  test('keeps a column the tree also states', () => {
    const { groups } = spanFields([
      schemaField({ name: UsageLogField.ResponseStatus, tag: SpanFieldTag.Response }),
      schemaField({ name: UsageLogField.OperationDurationMs, tag: SpanFieldTag.Performance }),
      schemaField({ name: UsageLogField.TotalTokens, tag: SpanFieldTag.TokenUsage }),
    ]);
    const grouped = groups.flatMap(({ fields }) => fields.map(({ name }) => name));

    expect(grouped).toEqual([
      UsageLogField.ResponseStatus,
      UsageLogField.OperationDurationMs,
      UsageLogField.TotalTokens,
    ]);
  });

  test('falls back to the base projection with no groups when the schema read gave nothing', () => {
    expect(spanFields()).toEqual({ names: SPAN_BASE_FIELDS, groups: [] });
    expect(spanFields([])).toEqual({ names: SPAN_BASE_FIELDS, groups: [] });
  });
});

describe('spanFields — the base projection against a narrower schema', () => {
  // An instance whose hop log predates a base column must not have it named: one unknown field rejects the
  // whole span query, which costs the reader the tree.
  test('names only the base columns the schema reports', () => {
    const { names } = spanFields([schemaField({ name: UsageLogField.CoreSpanId })]);

    expect(names).toEqual([UsageLogField.CoreSpanId]);
  });

  test('never names the unreadable column, in the projection or in a group', () => {
    const { names, groups } = spanFields([
      ...NON_SENSITIVE_SCHEMA,
      ...SPAN_UNREADABLE_FIELDS.map((name) => schemaField({ name, tag: SpanFieldTag.Provenance })),
    ]);

    for (const unreadable of SPAN_UNREADABLE_FIELDS) {
      expect(names).not.toContain(unreadable);
      expect(groups.flatMap(({ fields }) => fields.map(({ name }) => name))).not.toContain(unreadable);
    }
  });
});

describe('sessionFields', () => {
  const SCHEMA: AnalyticsEntityField[] = [
    schemaField({ name: 'client_session_id', tag: 'identity' }),
    schemaField({ name: 'client_type', tag: 'client' }),
    schemaField({ name: 'traces', tag: 'identity', heavy: true }),
    schemaField({ name: 'user_email', tag: 'principal', sensitive: true }),
    schemaField({ name: 'session_insights.title', tag: 'insight' }),
    schemaField({ name: 'reasoning_tokens', tag: 'token-usage', type: AnalyticsFieldType.Long }),
  ];

  test('reads every field the record carries except heavy and insight columns', () => {
    expect(sessionFields(SCHEMA).names).toEqual([
      'client_session_id',
      'client_type',
      'traces',
      'user_email',
      'reasoning_tokens',
    ]);
  });

  // The service removes a sensitive column from the schema for a caller without the role, so one that arrived
  // is one this caller may read.
  test('presents a sensitive column the schema reports', () => {
    expect(sessionFields(SCHEMA).groups.flatMap(({ fields }) => fields.map(({ name }) => name))).toContain(
      'user_email',
    );
  });

  test('reads the trace ids although the schema marks them heavy, and no other heavy column', () => {
    const { names } = sessionFields([...SCHEMA, schemaField({ name: 'raw_blob', heavy: true })]);

    expect(names).toContain('traces');
    expect(names).not.toContain('raw_blob');
  });

  test('groups by the schema tags in the order the schema reports them', () => {
    expect(sessionFields(SCHEMA).groups.map(({ tag }) => tag)).toEqual([
      'identity',
      'client',
      'principal',
      'token-usage',
    ]);
  });

  // The usage panel states a column in headline form, which rounds it, so the group states it in full.
  test('keeps a column another panel states in headline form', () => {
    const { names, groups } = sessionFields(SCHEMA);

    expect(names).toContain('reasoning_tokens');
    expect(groups.flatMap(({ fields }) => fields.map(({ name }) => name))).toContain('reasoning_tokens');
  });

  test('presents a tag the schema leaves off under the untagged group', () => {
    const { groups } = sessionFields([schemaField({ name: 'client_type' })]);

    expect(groups.map(({ tag }) => tag)).toEqual([UNTAGGED_SPAN_FIELD_TAG]);
  });

  test('reads and groups nothing when no schema is available', () => {
    expect(sessionFields()).toEqual({ names: [], groups: [] });
  });
});
