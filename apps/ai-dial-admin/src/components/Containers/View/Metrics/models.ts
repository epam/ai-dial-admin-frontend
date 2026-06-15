import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { DeploymentMetrics, DistributionSummary } from '@/src/models/deployments/metrics';

export enum MetricCardKind {
  Single = 'single',
  Gauge = 'gauge',
  Distribution = 'distribution',
  Ratio = 'ratio',
  Dual = 'dual',
}

// Half sections render two-up to save vertical space; full sections span the row.
export enum SectionWidth {
  Full = 'full',
  Half = 'half',
}

interface BaseCard {
  labelKey: string;
}

export interface SingleCardConfig extends BaseCard {
  kind: MetricCardKind.Single;
  unit?: string;
  getValue: (metrics: DeploymentMetrics) => number | null;
  // Resolve the unit from the data (e.g. pick Mb vs Gb); overrides the static `unit` when set.
  getUnit?: (metrics: DeploymentMetrics) => string | undefined;
  getStatus?: (value: number | null) => MetricStatus;
}

export interface GaugeCardConfig extends BaseCard {
  kind: MetricCardKind.Gauge;
  getValue: (metrics: DeploymentMetrics) => number | null;
  thresholds?: { warn: number; crit: number };
  getStatus?: (value: number | null) => MetricStatus;
}

export interface DistributionCardConfig extends BaseCard {
  kind: MetricCardKind.Distribution;
  unit?: string;
  getDistribution: (metrics: DeploymentMetrics) => DistributionSummary | null;
}

export interface RatioCardConfig extends BaseCard {
  kind: MetricCardKind.Ratio;
  getNumerator: (metrics: DeploymentMetrics) => number | null;
  getDenominator: (metrics: DeploymentMetrics) => number | null;
  getStatus?: (numerator: number | null, denominator: number | null) => MetricStatus;
}

export interface DualCardConfig extends BaseCard {
  kind: MetricCardKind.Dual;
  unit?: string;
  primaryLabelKey: string;
  secondaryLabelKey: string;
  getPrimary: (metrics: DeploymentMetrics) => number | null;
  getSecondary: (metrics: DeploymentMetrics) => number | null;
}

export type MetricCardConfig =
  | SingleCardConfig
  | GaugeCardConfig
  | DistributionCardConfig
  | RatioCardConfig
  | DualCardConfig;

export interface MetricsSectionConfig {
  titleKey: string;
  cards: MetricCardConfig[];
  width?: SectionWidth;
}
