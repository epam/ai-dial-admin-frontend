import { describe, expect, test } from 'vitest';

import {
  SessionDetailRow,
  SessionInsightField,
  SessionInsightsState,
  SessionsField,
} from '@/src/models/analytics/sessions-trace';
import { UNTAGGED_SPAN_FIELD_TAG } from '@/src/constants/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { readableWords } from '@/src/utils/analytics/session-formatting';
import {
  enrichmentColumnsOf,
  enrichmentPanelsOf,
  groupFieldsByTag,
  insightValueText,
  sessionInsightsState,
} from '@/src/utils/analytics/session-insights';

const NS = 'session_insights';

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

describe('enrichmentColumnsOf', () => {
  test('keeps only the columns of the named enrichment', () => {
    const columns = enrichmentColumnsOf(NS, [
      schemaField('total_tokens'),
      schemaField('session_insights.language'),
      schemaField('deployment_ref.display_name'),
    ]);

    expect(columns.map(({ name }) => name)).toEqual(['session_insights.language']);
  });

  // The point of deriving the set from the schema: an enrichment that gains a column needs no release here.
  test('keeps a column no frontend list enumerates', () => {
    const columns = enrichmentColumnsOf(NS, [schemaField('session_insights.some_future_signal')]);

    expect(columns.map(({ name }) => name)).toEqual(['session_insights.some_future_signal']);
  });

  test.each([AnalyticsFieldType.Object, AnalyticsFieldType.Array, AnalyticsFieldType.Map])(
    'keeps a %s column with its declared type',
    (type) => {
      const columns = enrichmentColumnsOf(NS, [
        schemaField('session_insights.topic'),
        schemaField('session_insights.non_scalar', { type }),
      ]);

      expect(columns.map(({ name, type: columnType }) => [name, columnType])).toEqual([
        ['session_insights.topic', AnalyticsFieldType.String],
        ['session_insights.non_scalar', type],
      ]);
    },
  );

  test('takes the label and the hint from what the schema reports', () => {
    const [resolved] = enrichmentColumnsOf(NS, [
      schemaField('session_insights.risk_level', { display_name: 'Risk · Level', description: 'Severity.' }),
    ]);

    expect(resolved).toMatchObject({ label: 'Risk · Level', hint: 'Severity.' });
  });

  test('labels a column the schema does not name from its own field name', () => {
    const [resolved] = enrichmentColumnsOf(NS, [schemaField('session_insights.resolution_status')]);

    expect(resolved.label).toBe('Resolution status');
  });

  test('preserves the schema order', () => {
    const columns = enrichmentColumnsOf(NS, [
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
    expect(enrichmentColumnsOf(NS, [schemaField('total_tokens')])).toEqual([]);
    expect(enrichmentColumnsOf(NS)).toEqual([]);
  });
});

describe('enrichmentColumnsOf — tags', () => {
  test('carries the tag the schema reports and omits an absent one', () => {
    const columns = enrichmentColumnsOf(NS, [
      schemaField(`${NS}.topic`, { tag: 'insight' }),
      schemaField(`${NS}.language`),
    ]);

    expect(columns[0].tag).toBe('insight');
    expect(columns[1]).not.toHaveProperty('tag');
  });
});

describe('groupFieldsByTag', () => {
  const tagged = (name: string, tag?: string) => column(name, tag ? { tag } : {});
  const tagsOf = (fields: ReturnType<typeof tagged>[], order?: string[]) =>
    groupFieldsByTag(fields, order).map(({ tag }) => tag);

  test('orders the groups by the declared tag order', () => {
    expect(tagsOf([tagged('a', 'quality'), tagged('b', 'insight')], ['insight', 'quality'])).toEqual([
      'insight',
      'quality',
    ]);
  });

  test('keeps a tag the declared order omits, after the declared ones, with system last', () => {
    const fields = [tagged('a', 'system'), tagged('b', 'risk'), tagged('c', 'insight')];

    expect(tagsOf(fields, ['insight', 'system'])).toEqual(['insight', 'risk', 'system']);
  });

  test('orders undeclared tags by their first field without a declared order', () => {
    expect(tagsOf([tagged('a', 'risk'), tagged('b'), tagged('c', 'risk')])).toEqual(['risk', UNTAGGED_SPAN_FIELD_TAG]);
  });

  test('describes each grouped field with its label, type, tag and the schema description', () => {
    const [group] = groupFieldsByTag([column('a', { tag: 'risk', hint: 'Severity.' }), column('b', { tag: 'risk' })]);

    expect(group.fields).toEqual([
      { name: 'a', label: expect.any(String), type: expect.any(String), tag: 'risk', description: 'Severity.' },
      { name: 'b', label: expect.any(String), type: expect.any(String), tag: 'risk' },
    ]);
  });

  test('holds every field of a tag in its group, in schema order', () => {
    const [group] = groupFieldsByTag([tagged('a', 'risk'), tagged('b', 'risk')]);

    expect(group.fields.map(({ name }) => name)).toEqual(['a', 'b']);
  });

  test('ignores a declared tag no field carries', () => {
    expect(tagsOf([tagged('a', 'risk')], ['insight'])).toEqual(['risk']);
  });

  test('returns no groups for no fields', () => {
    expect(groupFieldsByTag([])).toEqual([]);
  });
});

describe('enrichmentPanelsOf', () => {
  const RATING = ['rate_pos_count', 'rate_zero_count', 'rate_neg_count'].map((name) =>
    schemaField(`session_ratings.${name}`, { type: AnalyticsFieldType.Integer }),
  );

  test('renders one panel per enrichment namespace, in schema order, each with its own fields', () => {
    const panels = enrichmentPanelsOf([
      schemaField('total_tokens'),
      schemaField('quality.score'),
      schemaField(`${NS}.topic`),
      schemaField('quality.verdict'),
    ]);

    expect(panels.map(({ namespace, fields }) => [namespace, fields.map(({ name }) => name)])).toEqual([
      ['quality', ['quality.score', 'quality.verdict']],
      [NS, [`${NS}.topic`]],
    ]);
  });

  test('titles a panel by its namespace', () => {
    expect(enrichmentPanelsOf([schemaField('quality.score')])[0].title).toBe('quality');
  });

  test('renders no panel for the session rating enrichment', () => {
    const panels = enrichmentPanelsOf([...RATING, schemaField(`${NS}.topic`)]);

    expect(panels.map(({ namespace }) => namespace)).toEqual([NS]);
  });

  test('groups a panel by the declared tag order of its own namespace', () => {
    const [panel] = enrichmentPanelsOf(
      [
        schemaField(`${NS}.engine`, { tag: 'system' }),
        schemaField(`${NS}.risk`, { tag: 'risk' }),
        schemaField(`${NS}.topic`, { tag: 'insight' }),
      ],
      { [NS]: { tagOrder: ['insight', 'system'] }, other: { tagOrder: ['risk'] } },
    );

    expect(panel.groups.map(({ tag }) => tag)).toEqual(['insight', 'risk', 'system']);
  });

  test('carries the enrichment description of its own namespace and none without one', () => {
    const panels = enrichmentPanelsOf([schemaField('quality.score'), schemaField(`${NS}.topic`)], {
      quality: { tagOrder: [], description: 'Quality labels' },
    });

    expect(panels.map(({ namespace, description }) => [namespace, description])).toEqual([
      ['quality', 'Quality labels'],
      [NS, undefined],
    ]);
  });

  test('keeps the heading field and the summary out of the groups', () => {
    const [panel] = enrichmentPanelsOf(
      [schemaField(`${NS}.title`), schemaField(`${NS}.summary`), schemaField(`${NS}.topic`)],
      {},
      `${NS}.title`,
    );

    expect(panel.summary?.name).toBe(`${NS}.summary`);
    expect(panel.groups.flatMap(({ fields }) => fields.map(({ name }) => name))).toEqual([`${NS}.topic`]);
    expect(panel.fields).toHaveLength(3);
  });

  test('renders a panel for a namespace whose only field is an object', () => {
    const panels = enrichmentPanelsOf([schemaField('quality.blob', { type: AnalyticsFieldType.Object })]);

    expect(panels.map(({ namespace }) => namespace)).toEqual(['quality']);
  });

  test('renders no panel without a schema', () => {
    expect(enrichmentPanelsOf()).toEqual([]);
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

  test('reports not evaluated when the only list column holds no items', () => {
    const record = row({ [SessionsField.InsightTitle]: null, [SessionsField.InsightTopic]: [] as unknown as string });

    expect(sessionInsightsState(record, columns)).toBe(SessionInsightsState.NotEvaluated);
  });

  test('reports not evaluated when the only object column holds no entries', () => {
    const record = row({ [SessionsField.InsightTitle]: null, [SessionsField.InsightTopic]: {} as unknown as string });

    expect(sessionInsightsState(record, columns)).toBe(SessionInsightsState.NotEvaluated);
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
