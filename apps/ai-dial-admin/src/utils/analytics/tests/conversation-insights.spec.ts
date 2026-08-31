import { describe, expect, test } from 'vitest';

import { INSIGHT_BADGE_NEUTRAL_CLASS } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationDetailRow,
  ConversationFieldState,
  ConversationInsightsState,
  ConversationsField,
} from '@/src/models/analytics/conversations-trace';
import { readableWords } from '@/src/utils/analytics/conversation-formatting';
import {
  conversationInsightsState,
  resolutionBadgeClass,
  resolveInsightFields,
  sentimentBadgeClass,
} from '@/src/utils/analytics/conversation-insights';

const row = (fields: Partial<ConversationDetailRow> = {}): ConversationDetailRow =>
  ({ client_session_id: 'Lrr0e6L5bpTND3IY_dN0_', ...fields }) as ConversationDetailRow;

describe('conversationInsightsState', () => {
  test('reports the enrichment unavailable when the title key is absent', () => {
    expect(conversationInsightsState(row())).toBe(ConversationInsightsState.EnrichmentUnavailable);
  });

  test('reports not evaluated when the title is null', () => {
    expect(conversationInsightsState(row({ [ConversationsField.InsightTitle]: null }))).toBe(
      ConversationInsightsState.NotEvaluated,
    );
  });

  test('reports not evaluated when the title is blank', () => {
    expect(conversationInsightsState(row({ [ConversationsField.InsightTitle]: '' }))).toBe(
      ConversationInsightsState.NotEvaluated,
    );
  });

  test('reports available when the title carries a value', () => {
    expect(conversationInsightsState(row({ [ConversationsField.InsightTitle]: 'Rotating a shared API key' }))).toBe(
      ConversationInsightsState.Available,
    );
  });

  test('distinguishes an absent enrichment from an unevaluated conversation', () => {
    expect(conversationInsightsState(row())).not.toBe(
      conversationInsightsState(row({ [ConversationsField.InsightTitle]: null })),
    );
  });
});

describe('resolveInsightFields', () => {
  test('resolves a reported field to its value', () => {
    const fields = resolveInsightFields(row({ [ConversationsField.InsightSentiment]: 'neutral' }));

    expect(fields[ConversationsField.InsightSentiment]).toMatchObject({
      state: ConversationFieldState.Available,
      text: 'neutral',
    });
  });

  test('marks a field the schema does not report as unavailable', () => {
    const fields = resolveInsightFields(row());

    expect(fields[ConversationsField.InsightSummary]?.state).toBe(ConversationFieldState.Unavailable);
  });

  test('marks a reported field with no value as empty', () => {
    const fields = resolveInsightFields(row({ [ConversationsField.InsightTopic]: null }));

    expect(fields[ConversationsField.InsightTopic]?.state).toBe(ConversationFieldState.Empty);
  });

  test('carries each field label so the panel does not hold its own', () => {
    const fields = resolveInsightFields(row({ [ConversationsField.InsightLanguage]: 'en' }));

    expect(fields[ConversationsField.InsightLanguage]?.labelKey).toBeTruthy();
  });

  test('resolves the activity type as text', () => {
    const fields = resolveInsightFields(row({ [ConversationsField.InsightActivityType]: 'coding' }));

    expect(fields[ConversationsField.InsightActivityType]).toMatchObject({
      state: ConversationFieldState.Available,
      text: 'coding',
    });
  });
});

describe('badge classes', () => {
  test('styles each sentiment the evaluator emits', () => {
    ['positive', 'neutral', 'negative', 'mixed'].forEach((value) => {
      expect(sentimentBadgeClass(value)).not.toBe(INSIGHT_BADGE_NEUTRAL_CLASS);
    });
  });

  test('styles each resolution status the evaluator emits', () => {
    ['resolved', 'partially_resolved', 'unresolved', 'abandoned'].forEach((value) => {
      expect(resolutionBadgeClass(value)).not.toBe(INSIGHT_BADGE_NEUTRAL_CLASS);
    });
  });

  test('falls back to neutral for a value the frontend does not know', () => {
    expect(sentimentBadgeClass('ambivalent')).toBe(INSIGHT_BADGE_NEUTRAL_CLASS);
    expect(resolutionBadgeClass('escalated')).toBe(INSIGHT_BADGE_NEUTRAL_CLASS);
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
