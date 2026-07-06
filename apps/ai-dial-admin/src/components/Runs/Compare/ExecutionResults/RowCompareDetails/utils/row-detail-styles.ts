import classNames from 'classnames';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

export const COMPARE_DIFF_DATA_ATTR = 'data-compare-diff';

export type CompareDiffColumn = 'field' | 'value' | 'delta' | 'action';

export const compareDiffKindToDataAttr = (kind: MetricDeltaKind): string | undefined => {
  switch (kind) {
    case MetricDeltaKind.Added:
      return 'added';
    case MetricDeltaKind.Changed:
      return 'changed';
    case MetricDeltaKind.Removed:
      return 'removed';
    default:
      return undefined;
  }
};

const DIFF_BASE_CLASSES: Record<Exclude<MetricDeltaKind, MetricDeltaKind.Empty>, string> = {
  [MetricDeltaKind.Added]: 'bg-success border-solid border-t border-b border-accent-secondary',
  [MetricDeltaKind.Changed]: 'bg-info border-solid border-t border-b border-accent-primary',
  [MetricDeltaKind.Removed]: 'bg-error border-solid border-t border-b border-error',
};

const DIFF_EDGE_BY_COLUMN: Record<CompareDiffColumn, string> = {
  field: 'border-l border-r-0',
  value: 'border-l-0 border-r-0',
  delta: 'border-l-0 border-r-0',
  action: 'border-r border-l-0',
};

export const getCompareDiffCellClassName = (kind: MetricDeltaKind, column: CompareDiffColumn): string | undefined => {
  if (kind === MetricDeltaKind.Empty) {
    return undefined;
  }

  return classNames(DIFF_BASE_CLASSES[kind], DIFF_EDGE_BY_COLUMN[column]);
};

export const getCompareDiffCellProps = (
  kind: MetricDeltaKind,
  column: CompareDiffColumn,
): { className?: string; [COMPARE_DIFF_DATA_ATTR]?: string } => {
  const dataAttr = compareDiffKindToDataAttr(kind);
  const diffClass = getCompareDiffCellClassName(kind, column);

  if (!dataAttr || !diffClass) {
    return {};
  }

  return {
    className: classNames(diffClass),
    [COMPARE_DIFF_DATA_ATTR]: dataAttr,
  };
};

export type CompareDiffPivotPosition = 'top' | 'middle' | 'bottom' | 'single';

const DIFF_PIVOT_BASE_CLASSES: Record<Exclude<MetricDeltaKind, MetricDeltaKind.Empty>, string> = {
  [MetricDeltaKind.Added]: 'bg-success border-solid border-l border-r border-accent-secondary',
  [MetricDeltaKind.Changed]: 'bg-info border-solid border-l border-r border-accent-primary',
  [MetricDeltaKind.Removed]: 'bg-error border-solid border-l border-r border-error',
};

const DIFF_PIVOT_EDGE_BY_POSITION: Record<CompareDiffPivotPosition, string> = {
  top: 'border-t border-b-0',
  middle: 'border-t-0 border-b-0',
  bottom: 'border-t-0 border-b',
  single: 'border-t border-b',
};

export const getCompareDiffPivotCellProps = (
  kind: MetricDeltaKind,
  position: CompareDiffPivotPosition,
): { className?: string; [COMPARE_DIFF_DATA_ATTR]?: string } => {
  const dataAttr = compareDiffKindToDataAttr(kind);

  if (!dataAttr || kind === MetricDeltaKind.Empty) {
    return {};
  }

  return {
    className: classNames(DIFF_PIVOT_BASE_CLASSES[kind], DIFF_PIVOT_EDGE_BY_POSITION[position]),
    [COMPARE_DIFF_DATA_ATTR]: dataAttr,
  };
};
