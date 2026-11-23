import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import SessionEnrichmentPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionEnrichmentPanel';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { EnrichmentDefinition, SessionDetailRow, SessionsField } from '@/src/models/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { enrichmentPanelsOf } from '@/src/utils/analytics/session-insights';

const row = (fields: Partial<SessionDetailRow>): SessionDetailRow =>
  ({ chat_id: 'Lrr0e6L5bpTND3IY_dN0_', ...fields }) as SessionDetailRow;

const SUMMARY = 'The user asked how to rotate a shared project key and confirmed the old key was revoked.';

// The schema as an instance reports it — labels and hints included, since the panel takes both from here
// rather than from an i18n key.
const SCHEMA: AnalyticsEntityField[] = [
  { name: SessionsField.InsightTitle, source: 'title', type: AnalyticsFieldType.String },
  { name: SessionsField.InsightSummary, source: 'summary', type: AnalyticsFieldType.String },
  {
    name: SessionsField.InsightSentiment,
    source: 'sentiment',
    type: AnalyticsFieldType.Enum,
    display_name: 'Sentiment',
  },
  {
    name: SessionsField.InsightResolutionStatus,
    source: 'resolution_status',
    type: AnalyticsFieldType.Enum,
    display_name: 'Resolution status',
  },
  { name: SessionsField.InsightTopic, source: 'topic', type: AnalyticsFieldType.String, display_name: 'Topic' },
  {
    name: SessionsField.InsightLanguage,
    source: 'language',
    type: AnalyticsFieldType.String,
    display_name: 'Language',
    description: 'BCP-47 code of the dominant language of the user messages.',
  },
];

const EVALUATED: Partial<SessionDetailRow> = {
  [SessionsField.InsightTitle]: 'Rotating a shared API key',
  [SessionsField.InsightSummary]: SUMMARY,
  [SessionsField.InsightSentiment]: 'neutral',
  [SessionsField.InsightResolutionStatus]: 'resolved',
  [SessionsField.InsightTopic]: 'api keys',
  [SessionsField.InsightLanguage]: 'en',
};

const setup = (
  fields: Partial<SessionDetailRow> = EVALUATED,
  schema: AnalyticsEntityField[] = SCHEMA,
  headingField: string | null = SessionsField.InsightTitle,
  definitions: Record<string, EnrichmentDefinition> = {},
) =>
  render(
    <SessionEnrichmentPanel session={row(fields)} panel={enrichmentPanelsOf(schema, definitions, headingField)[0]} />,
  );

const OTHER_GROUP = new RegExp(SessionsTraceI18nKey.SpanTagOther);

const openGroup = async (name: RegExp | string) =>
  userEvent.setup().click(screen.getByRole('button', { name, expanded: false }));

const groupTitles = () =>
  screen.getAllByRole('button', { expanded: false }).map(({ textContent }) => textContent ?? '');

describe('SessionEnrichmentPanel', () => {
  test('states every field the enrichment reported a value for, once its group is open', async () => {
    setup();

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('api keys')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  test('starts with its groups closed', () => {
    setup();

    expect(screen.getByRole('button', { name: OTHER_GROUP, expanded: false })).toBeInTheDocument();
    expect(screen.queryByText('api keys')).toBeNull();
  });

  test('renders a field no frontend list enumerates', async () => {
    const schema: AnalyticsEntityField[] = [
      ...SCHEMA,
      {
        name: 'session_insights.risk_level',
        source: 'risk_level',
        type: AnalyticsFieldType.Enum,
        display_name: 'Risk · Level',
      },
    ];
    setup({ ...EVALUATED, 'session_insights.risk_level': 'medium' } as Partial<SessionDetailRow>, schema);

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('Risk · Level')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  test('labels a field the schema does not name from its own field name', async () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'session_insights.usage_scope', source: 'usage_scope', type: AnalyticsFieldType.String },
    ];
    setup({ 'session_insights.usage_scope': 'in scope' } as Partial<SessionDetailRow>, schema);

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('Usage scope')).toBeInTheDocument();
  });

  test('offers the schema description as a keyboard-reachable hint', async () => {
    setup();

    await openGroup(OTHER_GROUP);

    expect(
      screen.getByRole('button', { name: 'BCP-47 code of the dominant language of the user messages.' }),
    ).toBeInTheDocument();
  });

  test('offers no hint for a field the schema does not describe', async () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'session_insights.topic', source: 'topic', type: AnalyticsFieldType.String, display_name: 'Topic' },
    ];
    setup({ 'session_insights.topic': 'billing' } as Partial<SessionDetailRow>, schema);

    await openGroup(OTHER_GROUP);

    expect(screen.getByRole('button', { name: 'copy Topic' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('the summary renders as prose inside the field section, above the groups, and not as a row', async () => {
    setup();

    const summary = screen.getByText(SUMMARY);
    const groupHeader = screen.getByRole('button', { name: OTHER_GROUP, expanded: false });

    expect(summary.compareDocumentPosition(groupHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await openGroup(OTHER_GROUP);

    expect(screen.getAllByText('Summary')).toHaveLength(1);
  });

  test('labels the summary with its field label above the text', () => {
    setup();

    const label = screen.getByText('Summary');

    expect(label.compareDocumentPosition(screen.getByText(SUMMARY)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('renders neither the summary nor its label when the record carries no summary', () => {
    setup({ ...EVALUATED, [SessionsField.InsightSummary]: null });

    expect(screen.queryByText('Summary')).toBeNull();
    expect(screen.queryByText(SUMMARY)).toBeNull();
  });

  test('states the summary alone when no other field is left to group', () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'quality.summary', source: 'summary', type: AnalyticsFieldType.String },
    ];
    setup({ 'quality.summary': SUMMARY } as Partial<SessionDetailRow>, schema, null);

    expect(screen.getByText(SUMMARY)).toBeInTheDocument();
    expect(screen.queryByRole('button', { expanded: false })).toBeNull();
  });

  test('does not restate the title, which is the view heading', async () => {
    setup();

    await openGroup(OTHER_GROUP);

    expect(screen.queryByText('Rotating a shared API key')).toBeNull();
  });

  test('states the title field like any other when no Title role is bound to it', async () => {
    setup(EVALUATED, SCHEMA, null);

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('Rotating a shared API key')).toBeInTheDocument();
  });

  test('renders a list field as its items separated by a comma', async () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'quality.topics', source: 'topics', type: AnalyticsFieldType.Array, display_name: 'Topics' },
    ];
    setup({ 'quality.topics': ['billing', 'keys', 'quota'] } as unknown as Partial<SessionDetailRow>, schema, null);

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('billing, keys, quota')).toBeInTheDocument();
  });

  test('renders an object field as its key and value pairs', async () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'quality.scores', source: 'scores', type: AnalyticsFieldType.Object, display_name: 'Scores' },
    ];
    setup({ 'quality.scores': { clarity: 4 } } as unknown as Partial<SessionDetailRow>, schema, null);

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('clarity')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('a reported field with no value is stated as unavailable, with nothing to copy', async () => {
    setup({ ...EVALUATED, [SessionsField.InsightTopic]: null });

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByText(UNAVAILABLE_VALUE)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'copy Topic' })).toBeNull();
  });

  test('orders the groups by the declared tag order, with system last', () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'quality.engine', source: 'engine', type: AnalyticsFieldType.String, tag: 'system' },
      { name: 'quality.risk', source: 'risk', type: AnalyticsFieldType.String, tag: 'risk' },
      { name: 'quality.topic', source: 'topic', type: AnalyticsFieldType.String, tag: 'insight' },
    ];
    setup(
      { 'quality.engine': 'v2', 'quality.risk': 'low', 'quality.topic': 'billing' } as Partial<SessionDetailRow>,
      schema,
      null,
      { quality: { tagOrder: ['insight', 'system'] } },
    );

    const titles = groupTitles();

    expect(titles).toHaveLength(3);
    expect(titles[0]).toMatch(/^Insight/);
    expect(titles[1]).toMatch(/^Risk/);
    expect(titles[2]).toMatch(new RegExp(`^${SessionsTraceI18nKey.SpanTagSystem}`));
  });

  test('previews a closed group by its own first value, not by a session column of the same tag name', () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'quality.verdict', source: 'verdict', type: AnalyticsFieldType.String, tag: 'request' },
    ];
    setup({ 'quality.verdict': 'sound', request_method: 'POST' } as unknown as Partial<SessionDetailRow>, schema, null);

    expect(screen.getByRole('button', { name: /sound/, expanded: false })).toBeInTheDocument();
  });

  test('opening a group closes the one already open', async () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'quality.risk', source: 'risk', type: AnalyticsFieldType.String, tag: 'risk' },
      { name: 'quality.topic', source: 'topic', type: AnalyticsFieldType.String, tag: 'insight' },
    ];
    setup({ 'quality.risk': 'low', 'quality.topic': 'billing' } as Partial<SessionDetailRow>, schema, null);

    await openGroup(/^Risk/);
    await openGroup(/^Insight/);

    expect(screen.getByRole('region', { name: /^Insight/ })).toHaveTextContent('billing');
    expect(screen.queryByRole('region', { name: /^Risk/ })).toBeNull();
  });

  test('a closed-vocabulary value renders as readable words rather than the raw token', async () => {
    setup({ ...EVALUATED, [SessionsField.InsightResolutionStatus]: 'partially_resolved' });

    await openGroup(OTHER_GROUP);

    expect(screen.getByText('Partially resolved')).toBeInTheDocument();
    expect(screen.queryByText('partially_resolved')).toBeNull();
  });
});
