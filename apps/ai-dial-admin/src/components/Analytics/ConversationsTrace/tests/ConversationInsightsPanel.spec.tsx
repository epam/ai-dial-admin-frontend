import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ConversationInsightsPanel from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationInsightsPanel';
import { INSIGHT_BADGE_NEUTRAL_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationDetailRow, ConversationsField } from '@/src/models/analytics/conversations-trace';
import { resolveInsightFields } from '@/src/utils/analytics/conversation-insights';

const row = (fields: Partial<ConversationDetailRow>): ConversationDetailRow =>
  ({ chat_id: 'Lrr0e6L5bpTND3IY_dN0_', ...fields }) as ConversationDetailRow;

const SUMMARY = 'The user asked how to rotate a shared project key and confirmed the old key was revoked.';

const EVALUATED: Partial<ConversationDetailRow> = {
  [ConversationsField.InsightSummary]: SUMMARY,
  [ConversationsField.InsightSentiment]: 'neutral',
  [ConversationsField.InsightResolutionStatus]: 'resolved',
  [ConversationsField.InsightTopic]: 'api keys',
  [ConversationsField.InsightTopics]: 'api keys, rotation, project admin',
  [ConversationsField.InsightLanguage]: 'en',
  [ConversationsField.InsightSentimentScore]: '-0.4',
};

const setup = (fields: Partial<ConversationDetailRow> = EVALUATED) =>
  render(<ConversationInsightsPanel fields={resolveInsightFields(row(fields))} />);

describe('ConversationInsightsPanel', () => {
  test('states the evaluator reading of the conversation', () => {
    setup();

    expect(screen.getByText(SUMMARY)).toBeInTheDocument();
    expect(screen.getByText('api keys, rotation, project admin')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  test('the summary renders as prose, not as a labelled value row', () => {
    setup();

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailSummary)).toBeNull();
    expect(screen.getByText(SUMMARY).tagName).toBe('P');
  });

  test('a closed-vocabulary value renders as readable words rather than the raw token', () => {
    setup({ ...EVALUATED, [ConversationsField.InsightResolutionStatus]: 'partially_resolved' });

    expect(screen.getByText('Partially resolved')).toBeInTheDocument();
    expect(screen.queryByText('partially_resolved')).toBeNull();
  });

  test('each badge is announced with the question it answers', () => {
    setup();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailSentiment)).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.DetailResolutionStatus)).toBeInTheDocument();
  });

  test('an unrecognised vocabulary value still renders, neutrally styled', () => {
    setup({ ...EVALUATED, [ConversationsField.InsightSentiment]: 'ambivalent' });

    const badge = screen.getByText('Ambivalent');

    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain(INSIGHT_BADGE_NEUTRAL_CLASS.split(' ')[0]);
  });

  test('renders no badge row when neither closed-vocabulary field has a value', () => {
    setup({ [ConversationsField.InsightSummary]: SUMMARY });

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailSentiment)).toBeNull();
    expect(screen.queryByText(ConversationsTraceI18nKey.DetailResolutionStatus)).toBeNull();
  });

  test('a field the schema does not report renders the unavailable marker', () => {
    setup({ ...EVALUATED, [ConversationsField.InsightLanguage]: undefined });

    const label = screen.getByText(ConversationsTraceI18nKey.DetailLanguage);

    expect(label.parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('a reported field with no value renders nothing rather than a marker', () => {
    setup({ ...EVALUATED, [ConversationsField.InsightTopic]: null });

    expect(screen.queryByText(ConversationsTraceI18nKey.DetailTopic)).toBeNull();
  });

  test('renders the sentiment score beside the sentiment it buckets', () => {
    setup();

    const label = screen.getByText(ConversationsTraceI18nKey.DetailSentimentScore);

    expect(label.parentElement).toHaveTextContent('-0.4');
  });
});
