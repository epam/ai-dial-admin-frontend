import { describe, expect, test } from 'vitest';

import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { columnHeaderName, enrichmentOf } from '@/src/utils/analytics/conversation-enrichment';

const field = (name: string, overrides: Partial<AnalyticsEntityField> = {}): AnalyticsEntityField => ({
  name,
  source: name.slice(name.indexOf('.') + 1),
  type: AnalyticsFieldType.String,
  ...overrides,
});

describe('enrichmentOf', () => {
  test('reads the namespace off a qualified name', () => {
    expect(enrichmentOf('session_insights.title')).toBe('session_insights');
  });

  test('reports no namespace for a plain column of the rollup', () => {
    expect(enrichmentOf('total_tokens')).toBe('');
  });

  test('treats a leading dot as no namespace rather than an empty one', () => {
    expect(enrichmentOf('.title')).toBe('');
  });
});

describe('columnHeaderName', () => {
  test('uses the display name the schema reports', () => {
    expect(columnHeaderName(field('traces', { display_name: 'Trace IDs' }))).toBe('Trace IDs');
  });

  test('renders the field name readably where no display name is reported', () => {
    expect(columnHeaderName(field('avg_duration_ms'))).toBe('Avg duration ms');
  });

  test('drops the enrichment namespace, which whatever renders the field already names', () => {
    expect(columnHeaderName(field('session_insights.sentiment_score'))).toBe('Sentiment score');
  });
});
