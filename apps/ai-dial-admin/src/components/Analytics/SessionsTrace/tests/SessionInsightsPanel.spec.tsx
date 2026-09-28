import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SessionInsightsPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionInsightsPanel';
import { SessionDetailRow, SessionsField } from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { insightColumnsOf } from '@/src/utils/analytics/session-insights';

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

const setup = (fields: Partial<SessionDetailRow> = EVALUATED, schema: AnalyticsEntityField[] = SCHEMA) =>
  render(<SessionInsightsPanel session={row(fields)} columns={insightColumnsOf(schema)} />);

describe('SessionInsightsPanel', () => {
  test('states every field the enrichment reported a value for', () => {
    setup();

    expect(screen.getByText(SUMMARY)).toBeInTheDocument();
    expect(screen.getByText('api keys')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  // The whole point of deriving the field set from the schema: nothing here enumerates the enrichment.
  test('renders a field no frontend list enumerates', () => {
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

    expect(screen.getByText('Risk · Level')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  test('labels a field with the display name the schema reports', () => {
    setup();

    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  test('labels a field the schema does not name from its own field name', () => {
    const schema: AnalyticsEntityField[] = [
      { name: 'session_insights.usage_scope', source: 'usage_scope', type: AnalyticsFieldType.String },
    ];
    setup({ 'session_insights.usage_scope': 'in scope' } as Partial<SessionDetailRow>, schema);

    expect(screen.getByText('Usage scope')).toBeInTheDocument();
  });

  test('offers the schema description as a keyboard-reachable hint', () => {
    setup();

    const hint = screen.getByRole('button', {
      name: 'BCP-47 code of the dominant language of the user messages.',
    });

    expect(hint).toBeInTheDocument();
  });

  test('the summary renders as prose, without a label of its own', () => {
    setup();

    expect(screen.getByText(SUMMARY).tagName).toBe('P');
    expect(screen.queryByText('Summary')).toBeNull();
  });

  test('does not restate the title, which is the view heading', () => {
    setup();

    expect(screen.queryByText('Rotating a shared API key')).toBeNull();
  });

  test('a closed-vocabulary value renders as readable words rather than the raw token', () => {
    setup({ ...EVALUATED, [SessionsField.InsightResolutionStatus]: 'partially_resolved' });

    expect(screen.getByText('Partially resolved')).toBeInTheDocument();
    expect(screen.queryByText('partially_resolved')).toBeNull();
  });

  test('a vocabulary value the frontend does not know renders like any other', () => {
    setup({ ...EVALUATED, [SessionsField.InsightSentiment]: 'ambivalent' });

    expect(screen.getByText('Ambivalent')).toBeInTheDocument();
  });

  // Superseded columns stay in the enrichment and come back null on a row a later evaluator labelled, so
  // rendering them would fill the panel with rows meaning only "this row is newer than that column".
  test('a reported field with no value renders nothing rather than a blank row', () => {
    setup({ ...EVALUATED, [SessionsField.InsightTopic]: null });

    expect(screen.queryByText('Topic')).toBeNull();
  });

  test('a field the record does not carry at all renders nothing', () => {
    setup({ ...EVALUATED, [SessionsField.InsightLanguage]: undefined });

    expect(screen.queryByText('Language')).toBeNull();
  });
});
