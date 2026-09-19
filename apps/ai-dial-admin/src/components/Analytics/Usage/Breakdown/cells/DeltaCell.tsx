'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import DeltaValue from '@/src/components/Analytics/Usage/Delta/DeltaValue';
import { BreakdownRowModel, KpiMetric } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/**
 * The change is in calls, so it is toned the way the Requests card tones its own — more traffic
 * reads as growth.
 */
const DeltaCell: FC<ICellRendererParams<BreakdownRowModel>> = ({ data }) => {
  const t = useI18n();

  if (!data) {
    return null;
  }

  if (data.isNewRow) {
    return <span className="text-secondary">{t(AnalyticsUsageI18nKey.RowIsNew)}</span>;
  }

  if (data.deltaRatio == null) {
    return <span className="text-secondary">—</span>;
  }

  return <DeltaValue ratio={data.deltaRatio} metric={KpiMetric.Requests} />;
};

export default DeltaCell;
