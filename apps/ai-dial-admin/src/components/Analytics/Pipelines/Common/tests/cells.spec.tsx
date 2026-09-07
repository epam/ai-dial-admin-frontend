import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EvaluatorCell from '@/src/components/Analytics/Pipelines/Common/EvaluatorCell';
import PipelineEnabledBadge from '@/src/components/Analytics/Pipelines/Common/PipelineEnabledBadge';
import PipelineKindCell from '@/src/components/Analytics/Pipelines/Common/PipelineKindCell';
import TriggerCell from '@/src/components/Analytics/Pipelines/Common/TriggerCell';
import { AnalyticsPipelinesI18nKey, AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { PipelineListItem, TriggerKind, PipelineKind } from '@/src/models/analytics/pipeline';

const baseRule: PipelineListItem = {
  name: 'rule',
  kind: PipelineKind.Enrich,
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target: 'turn_feedback',
  grain_key: 'response_id',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
};

describe('Pipelines :: TriggerCell', () => {
  test('shows the trigger kind alone, without its qualifier', () => {
    render(<TriggerCell pipeline={{ ...baseRule, trigger: { kind: TriggerKind.Schedule, cron: '0 0 * * * *' } }} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.TriggerSchedule)).toBeInTheDocument();
    expect(screen.queryByText('0 0 * * * *')).not.toBeInTheDocument();
  });

  test('shows a group badge without its grouping column', () => {
    render(<TriggerCell pipeline={{ ...baseRule, trigger: { kind: TriggerKind.Group, group_by: 'chat_id' } }} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.TriggerGroup)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupedBy)).not.toBeInTheDocument();
  });

  test('shows an on-ingest badge with no qualifier', () => {
    render(<TriggerCell pipeline={baseRule} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.TriggerOnIngest)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupedBy)).not.toBeInTheDocument();
  });

  test('renders nothing without a rule', () => {
    const { container } = render(<TriggerCell />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('Pipelines :: EvaluatorCell', () => {
  test('shows the pinned name, version and type badge', () => {
    render(<EvaluatorCell pipeline={baseRule} />);

    expect(screen.getByText('feedback-rollup@2')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql)).toBeInTheDocument();
  });

  test('marks an unpinned rule as following latest', () => {
    render(<EvaluatorCell pipeline={{ ...baseRule, evaluator_version: undefined }} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.Latest)).toBeInTheDocument();
  });

  test('does not mark a pinned rule as latest', () => {
    render(<EvaluatorCell pipeline={baseRule} />);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.Latest)).not.toBeInTheDocument();
  });
});

describe('Pipelines :: PipelineEnabledBadge', () => {
  test('carries text rather than colour alone for an enabled rule', () => {
    render(<PipelineEnabledBadge enabled />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled)).toBeInTheDocument();
  });

  test('carries text for a disabled rule', () => {
    render(<PipelineEnabledBadge enabled={false} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusDisabled)).toBeInTheDocument();
  });

  test('renders nothing when the flag is absent', () => {
    const { container } = render(<PipelineEnabledBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('Pipelines :: PipelineKindCell', () => {
  test('names each kind rather than carrying it by colour alone', () => {
    const { rerender } = render(<PipelineKindCell kind={PipelineKind.Enrich} />);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.KindEnrich)).toBeInTheDocument();

    rerender(<PipelineKindCell kind={PipelineKind.Aggregate} />);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.KindAggregate)).toBeInTheDocument();
  });

  test('renders nothing when a row carries no kind', () => {
    const { container } = render(<PipelineKindCell />);
    expect(container).toBeEmptyDOMElement();
  });
});
