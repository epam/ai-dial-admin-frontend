import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { AnalyticsFieldType } from '@/src/models/analytics/entity';

const TYPE_COLOR: Partial<Record<AnalyticsFieldType, string>> = {
  [AnalyticsFieldType.Uuid]: 'text-primary',
  [AnalyticsFieldType.String]: 'text-info',
  [AnalyticsFieldType.Integer]: 'text-success',
  [AnalyticsFieldType.Long]: 'text-success',
  [AnalyticsFieldType.Decimal]: 'text-success',
  [AnalyticsFieldType.Boolean]: 'text-warning',
  [AnalyticsFieldType.Date]: 'text-secondary',
  [AnalyticsFieldType.Timestamp]: 'text-secondary',
  [AnalyticsFieldType.Object]: 'text-accent-tertiary',
  [AnalyticsFieldType.Array]: 'text-error',
};

interface Props {
  type?: string;
}

const TypeBadge: FC<Props> = ({ type }) => {
  if (!type) return null;
  return (
    <span
      className={classNames(
        'inline-block rounded bg-layer-4 px-2 py-0.5 font-semibold uppercase dial-tiny-text',
        TYPE_COLOR[type as AnalyticsFieldType] ?? 'text-secondary',
      )}
    >
      {type}
    </span>
  );
};

export const TypeCellRenderer: FC<ICellRendererParams> = ({ value }) => <TypeBadge type={value as string} />;

export default TypeBadge;
