import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EvaluatorCell from '@/src/components/Analytics/EnrichmentRules/EvaluatorCell';
import RuleEnabledBadge from '@/src/components/Analytics/EnrichmentRules/RuleEnabledBadge';
import TriggerCell from '@/src/components/Analytics/EnrichmentRules/TriggerCell';
import { AnalyticsEnrichmentRulesI18nKey, AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';

const baseRule: EnrichmentRuleListItem = {
  id: 'r_1',
  name: 'rule',
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target_enrichment: 'turn_feedback',
  grain_key: 'response_id',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
};

describe('EnrichmentRules :: TriggerCell', () => {
  test('shows a schedule badge with its cron beneath', () => {
    render(<TriggerCell rule={{ ...baseRule, trigger_kind: TriggerKind.Schedule, trigger_cron: '0 0 * * * *' }} />);

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerSchedule)).toBeInTheDocument();
    expect(screen.getByText('0 0 * * * *')).toBeInTheDocument();
  });

  test('shows a group badge with its grouping column beneath', () => {
    render(<TriggerCell rule={{ ...baseRule, trigger_kind: TriggerKind.Group, group_by: 'chat_id' }} />);

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerGroup)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.GroupedBy)).toBeInTheDocument();
  });

  test('shows an on-ingest badge with no qualifier', () => {
    render(<TriggerCell rule={baseRule} />);

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerOnIngest)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.GroupedBy)).not.toBeInTheDocument();
  });

  test('renders nothing without a rule', () => {
    const { container } = render(<TriggerCell />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('EnrichmentRules :: EvaluatorCell', () => {
  test('shows the pinned name, version and type badge', () => {
    render(<EvaluatorCell rule={baseRule} />);

    expect(screen.getByText('feedback-rollup@2')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql)).toBeInTheDocument();
  });

  test('marks an unpinned rule as following latest', () => {
    render(<EvaluatorCell rule={{ ...baseRule, evaluator_version: undefined }} />);

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.Latest)).toBeInTheDocument();
  });

  test('does not mark a pinned rule as latest', () => {
    render(<EvaluatorCell rule={baseRule} />);

    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.Latest)).not.toBeInTheDocument();
  });
});

describe('EnrichmentRules :: RuleEnabledBadge', () => {
  test('carries text rather than colour alone for an enabled rule', () => {
    render(<RuleEnabledBadge enabled />);

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.StatusEnabled)).toBeInTheDocument();
  });

  test('carries text for a disabled rule', () => {
    render(<RuleEnabledBadge enabled={false} />);

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.StatusDisabled)).toBeInTheDocument();
  });

  test('renders nothing when the flag is absent', () => {
    const { container } = render(<RuleEnabledBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});
