import { describe, expect, test } from 'vitest';

import {
  SessionDetailRow,
  SessionInsightField,
  SessionInsightsState,
  SessionsField,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { readableWords } from '@/src/utils/analytics/session-formatting';
import { sessionInsightsState, insightColumnsOf, insightValueText } from '@/src/utils/analytics/session-insights';

const row = (fields: Partial<SessionDetailRow> = {}): SessionDetailRow =>
  ({ client_session_id: 'Lrr0e6L5bpTND3IY_dN0_', ...fields }) as SessionDetailRow;

const schemaField = (name: string, overrides: Partial<AnalyticsEntityField> = {}): AnalyticsEntityField => ({
  name,
  source: name.slice(name.indexOf('.') + 1),
  type: AnalyticsFieldType.String,
  ...overrides,
});

const column = (name: string, overrides: Partial<SessionInsightField> = {}): SessionInsightField => ({
  name,
  label: name,
  type: AnalyticsFieldType.String,
  ...overrides,
});

describe('insightColumnsOf', () => {
  test('keeps only the columns the insight enrichment exposes', () => {
    const columns = insightColumnsOf([
      schemaField('total_tokens'),
      schemaField('session_insights.language'),
      schemaField('deployment_ref.display_name'),
    ]);

    expect(columns.map(({ name }) => name)).toEqual(['session_insights.language']);
  });

  // The point of deriving the set from the schema: an enrichment that gains a column needs no release here.
  test('keeps a column no frontend list enumerates', () => {
    const columns = insightColumnsOf([schemaField('session_insights.some_future_signal')]);

    expect(columns.map(({ name }) => name)).toEqual(['session_insights.some_future_signal']);
  });

  test('drops a column the panel could not render as a value', () => {
    const columns = insightColumnsOf([
      schemaField('session_insights.topic'),
      schemaField('session_insights.evidence', { type: AnalyticsFieldType.Object }),
      schemaField('session_insights.samples', { type: AnalyticsFieldType.Array }),
    ]);

    expect(columns.map(({ name }) => name)).toEqual(['session_insights.topic']);
  });

  test('takes the label and the hint from what the schema reports', () => {
    const [resolved] = insightColumnsOf([
      schemaField('session_insights.risk_level', { display_name: 'Risk · Level', description: 'Severity.' }),
    ]);

    expect(resolved).toMatchObject({ label: 'Risk · Level', hint: 'Severity.' });
  });

  test('labels a column the schema does not name from its own field name', () => {
    const [resolved] = insightColumnsOf([schemaField('session_insights.resolution_status')]);

    expect(resolved.label).toBe('Resolution status');
  });

  test('preserves the schema order', () => {
    const columns = insightColumnsOf([
      schemaField('session_insights.summary'),
      schemaField('session_insights.language'),
      schemaField('session_insights.topic'),
    ]);

    expect(columns.map(({ name }) => name)).toEqual([
      'session_insights.summary',
      'session_insights.language',
      'session_insights.topic',
    ]);
  });

  test('reports nothing for an instance whose schema carries no enrichment', () => {
    expect(insightColumnsOf([schemaField('total_tokens')])).toEqual([]);
    expect(insightColumnsOf()).toEqual([]);
  });
});

describe('insightValueText', () => {
  test('renders a plain string as recorded', () => {
    const text = insightValueText(row({ [SessionsField.InsightTopic]: 'document generation' }), {
      ...column(SessionsField.InsightTopic),
    });

    expect(text).toBe('document generation');
  });

  // Follows the declared type rather than the field name, so a field newly typed as an enum reads as words
  // without a change here.
  test('renders a closed-vocabulary value as readable words', () => {
    const text = insightValueText(row({ [SessionsField.InsightResolutionStatus]: 'partially_resolved' }), {
      ...column(SessionsField.InsightResolutionStatus, { type: AnalyticsFieldType.Enum }),
    });

    expect(text).toBe('Partially resolved');
  });

  // A machine-looking value in a column the schema types as a plain string is what the record holds, and
  // rewriting it on shape rather than on type would silently edit a file name or an identifier.
  test('leaves an underscored value alone where the schema types it as a string', () => {
    const text = insightValueText(row({ 'session_insights.activity_detail': 'bug_fixing' }), {
      ...column('session_insights.activity_detail'),
    });

    expect(text).toBe('bug_fixing');
  });

  test('renders a timestamp in the local format the other panels use', () => {
    const text = insightValueText(row({ 'session_insights.enriched_at': 1756000000000 }), {
      ...column('session_insights.enriched_at', { type: AnalyticsFieldType.Timestamp }),
    });

    expect(text).not.toBe('1756000000000');
    expect(text).not.toBe('');
  });

  test('renders a recorded false rather than treating it as absent', () => {
    const text = insightValueText(row({ 'session_insights.truncated': false }), {
      ...column('session_insights.truncated', { type: AnalyticsFieldType.Boolean }),
    });

    expect(text).toBe('false');
  });

  test('renders a zero rather than treating it as absent', () => {
    const text = insightValueText(row({ 'session_insights.evaluator_version': 0 }), {
      ...column('session_insights.evaluator_version', { type: AnalyticsFieldType.Integer }),
    });

    expect(text).toBe('0');
  });

  test('reports nothing for a column the record carries no value for', () => {
    expect(insightValueText(row(), column(SessionsField.InsightTopic))).toBe('');
    expect(insightValueText(row({ [SessionsField.InsightTopic]: null }), column(SessionsField.InsightTopic))).toBe('');
    expect(insightValueText(row({ [SessionsField.InsightTopic]: '' }), column(SessionsField.InsightTopic))).toBe('');
  });
});

describe('sessionInsightsState', () => {
  const columns = [column(SessionsField.InsightTitle), column(SessionsField.InsightTopic)];

  test('reports the enrichment unavailable when the row carries none of its columns', () => {
    expect(sessionInsightsState(row(), columns)).toBe(SessionInsightsState.EnrichmentUnavailable);
  });

  test('reports the enrichment unavailable when the schema reports no insight column at all', () => {
    expect(sessionInsightsState(row(), [])).toBe(SessionInsightsState.EnrichmentUnavailable);
  });

  test('reports not evaluated when every projected column is empty', () => {
    const record = row({ [SessionsField.InsightTitle]: null, [SessionsField.InsightTopic]: '' });

    expect(sessionInsightsState(record, columns)).toBe(SessionInsightsState.NotEvaluated);
  });

  // The reason this is not keyed on the title: a row the evaluator did reach, whose title alone came back
  // blank, is an evaluated session and its other fields are worth showing.
  test('reports available when any projected column carries a value', () => {
    const record = row({ [SessionsField.InsightTitle]: null, [SessionsField.InsightTopic]: 'billing' });

    expect(sessionInsightsState(record, columns)).toBe(SessionInsightsState.Available);
  });

  test('distinguishes an absent enrichment from an unevaluated session', () => {
    const unevaluated = row({ [SessionsField.InsightTitle]: null });

    expect(sessionInsightsState(row(), columns)).not.toBe(sessionInsightsState(unevaluated, columns));
  });
});

describe('readableWords', () => {
  test('renders an underscored service token as words', () => {
    expect(readableWords('partially_resolved')).toBe('Partially resolved');
  });

  test('renders a kebab-cased token as words', () => {
    expect(readableWords('not-evaluated')).toBe('Not evaluated');
  });

  test('leaves a single lowercase word capitalized only', () => {
    expect(readableWords('resolved')).toBe('Resolved');
  });

  test('returns an empty string unchanged', () => {
    expect(readableWords('')).toBe('');
  });
});
