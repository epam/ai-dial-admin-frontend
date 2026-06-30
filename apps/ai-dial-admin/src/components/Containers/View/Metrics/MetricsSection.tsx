import classNames from 'classnames';
import { FC } from 'react';

import SingleValueContent from '@/src/components/Common/SingleValue/SingleValueContent';
import DistributionCard from '@/src/components/Deployments/Common/MetricCard/DistributionCard';
import DualValueCard from '@/src/components/Deployments/Common/MetricCard/DualValueCard';
import GaugeCard from '@/src/components/Deployments/Common/MetricCard/GaugeCard';
import RatioBadgeCard from '@/src/components/Deployments/Common/MetricCard/RatioBadgeCard';
import { UnitPosition } from '@/src/components/Common/SingleValue/models';
import {
  MetricCardConfig,
  MetricCardKind,
  MetricsSectionConfig,
  SectionWidth,
} from '@/src/components/Containers/View/Metrics/models';
import { useI18n } from '@/src/locales/client';
import { DeploymentMetrics } from '@/src/models/deployments/metrics';

interface Props {
  section: MetricsSectionConfig;
  metrics: DeploymentMetrics | null;
  loading: boolean;
}

const renderCard = (card: MetricCardConfig, metrics: DeploymentMetrics | null, loading: boolean) => {
  switch (card.kind) {
    case MetricCardKind.Gauge: {
      const value = metrics ? card.getValue(metrics) : null;
      const status = card.getStatus ? card.getStatus(value) : undefined;
      return (
        <GaugeCard
          key={card.labelKey}
          title={card.labelKey}
          value={value}
          loading={loading}
          status={status}
          thresholds={card.thresholds}
        />
      );
    }
    case MetricCardKind.Distribution: {
      const distribution = metrics ? card.getDistribution(metrics) : null;
      return (
        <DistributionCard
          key={card.labelKey}
          title={card.labelKey}
          distribution={distribution}
          unit={card.unit}
          loading={loading}
        />
      );
    }
    case MetricCardKind.Ratio: {
      const numerator = metrics ? card.getNumerator(metrics) : null;
      const denominator = metrics ? card.getDenominator(metrics) : null;
      const status = card.getStatus ? card.getStatus(numerator, denominator) : undefined;
      return (
        <RatioBadgeCard
          key={card.labelKey}
          title={card.labelKey}
          numerator={numerator}
          denominator={denominator}
          loading={loading}
          status={status}
        />
      );
    }
    case MetricCardKind.Dual: {
      return (
        <DualValueCard
          key={card.labelKey}
          title={card.labelKey}
          primary={metrics ? card.getPrimary(metrics) : null}
          secondary={metrics ? card.getSecondary(metrics) : null}
          primaryLabel={card.primaryLabelKey}
          secondaryLabel={card.secondaryLabelKey}
          unit={card.unit}
          loading={loading}
        />
      );
    }
    case MetricCardKind.Single:
    default: {
      const value = metrics ? card.getValue(metrics) : null;
      const status = card.getStatus ? card.getStatus(value) : undefined;
      const unit = metrics && card.getUnit ? card.getUnit(metrics) : card.unit;
      return (
        <SingleValueContent
          key={card.labelKey}
          title={card.labelKey}
          value={value}
          loading={loading}
          unit={unit}
          unitPosition={UnitPosition.Suffix}
          status={status}
        />
      );
    }
  }
};

const MetricsSection: FC<Props> = ({ section, metrics, loading }) => {
  const t = useI18n();

  const isHalf = section.width === SectionWidth.Half;
  // Half sections sit two-up and show 2 cards per row; full sections span the row and pack up to 4.
  const cardGrid = isHalf ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={classNames('flex flex-col gap-3', !isHalf && 'lg:col-span-2')}>
      <h3>{t(section.titleKey)}</h3>
      <div className={classNames('grid gap-4', cardGrid)}>
        {section.cards.map((card) => renderCard(card, metrics, loading))}
      </div>
    </div>
  );
};

export default MetricsSection;
