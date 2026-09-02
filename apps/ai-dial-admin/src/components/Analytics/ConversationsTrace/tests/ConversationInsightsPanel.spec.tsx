import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationInsightsPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationInsightsPanel';
import { ConversationDetailRow, ConversationsField } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { insightColumnsOf } from '@/src/utils/analytics/conversation-insights';

const row = (fields: Partial<ConversationDetailRow>): ConversationDetailRow =>
  ({ chat_id: 'Lrr0e6L5bpTND3IY_dN0_', ...fields }) as ConversationDetailRow;

const SUMMARY = 'The user asked how to rotate a shared project key and confirmed the old key was revoked.';

// The schema as an instance reports it — labels and hints included, since the panel takes both from here
// rather than from an i18n key.
const SCHEMA: AnalyticsEntityField[] = [
  { name: ConversationsField.InsightTitle, source: 'title', type: AnalyticsFieldType.String },
  { name: ConversationsField.InsightSummary, source: 'summary', type: AnalyticsFieldType.String },
  {
    name: ConversationsField.InsightSentiment,
    source: 'sentiment',
    type: AnalyticsFieldType.Enum,
    display_name: 'Sentiment',
  },
  {
    name: ConversationsField.InsightResolutionStatus,
    source: 'resolution_status',
    type: AnalyticsFieldType.Enum,
    display_name: 'Resolution status',
  },
  { name: ConversationsField.InsightTopic, source: 'topic', type: AnalyticsFieldType.String, display_name: 'Topic' },
  {
    name: ConversationsField.InsightLanguage,
    source: 'language',
    type: AnalyticsFieldType.String,
    display_name: 'Language',
    description: 'BCP-47 code of the dominant language of the user messages.',
  },
];

const EVALUATED: Partial<ConversationDetailRow> = {
  [ConversationsField.InsightTitle]: 'Rotating a shared API key',
  [ConversationsField.InsightSummary]: SUMMARY,
  [ConversationsField.InsightSentiment]: 'neutral',
  [ConversationsField.InsightResolutionStatus]: 'resolved',
  [ConversationsField.InsightTopic]: 'api keys',
  [ConversationsField.InsightLanguage]: 'en',
};

const setup = (fields: Partial<ConversationDetailRow> = EVALUATED, schema: AnalyticsEntityField[] = SCHEMA) =>
  render(<ConversationInsightsPanel conversation={row(fields)} columns={insightColumnsOf(schema)} />);

describe('ConversationInsightsPanel', () => {
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
    setup({ ...EVALUATED, 'session_insights.risk_level': 'medium' } as Partial<ConversationDetailRow>, schema);

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
    setup({ 'session_insights.usage_scope': 'in scope' } as Partial<ConversationDetailRow>, schema);

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
    setup({ ...EVALUATED, [ConversationsField.InsightResolutionStatus]: 'partially_resolved' });

    expect(screen.getByText('Partially resolved')).toBeInTheDocument();
    expect(screen.queryByText('partially_resolved')).toBeNull();
  });

  test('a vocabulary value the frontend does not know renders like any other', () => {
    setup({ ...EVALUATED, [ConversationsField.InsightSentiment]: 'ambivalent' });

    expect(screen.getByText('Ambivalent')).toBeInTheDocument();
  });

  // Superseded columns stay in the enrichment and come back null on a row a later evaluator labelled, so
  // rendering them would fill the panel with rows meaning only "this row is newer than that column".
  test('a reported field with no value renders nothing rather than a blank row', () => {
    setup({ ...EVALUATED, [ConversationsField.InsightTopic]: null });

    expect(screen.queryByText('Topic')).toBeNull();
  });

  test('a field the record does not carry at all renders nothing', () => {
    setup({ ...EVALUATED, [ConversationsField.InsightLanguage]: undefined });

    expect(screen.queryByText('Language')).toBeNull();
  });
});
