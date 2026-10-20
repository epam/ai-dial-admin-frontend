import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
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
  [AnalyticsFieldType.Enum]: 'text-accent-secondary',
  [AnalyticsFieldType.Map]: 'text-accent-primary',
};

interface Props {
  type?: string;
}

const TypeBadge: FC<Props> = ({ type }) => {
  if (!type) return null;
  return <IdentityTag label={type} colorClassName={TYPE_COLOR[type as AnalyticsFieldType]} />;
};

export const TypeCellRenderer: FC<ICellRendererParams> = ({ value }) => <TypeBadge type={value as string} />;

export default TypeBadge;
