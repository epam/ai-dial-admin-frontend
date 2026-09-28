'use client';

import { FC } from 'react';

import SidePanel from '@/src/components/Common/SidePanel/SidePanel';
import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import { formatDuration, formatGroupedNumber, formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  row: BreakdownRowModel | null;
  onClose: () => void;
}

interface Tile {
  labelKey: AnalyticsUsageI18nKey;
  value: string;
}

const RowDetailPanel: FC<Props> = ({ row, onClose }) => {
  const t = useI18n();

  if (!row) {
    return null;
  }

  const calls = formatGroupedNumber(row.calls);
  const latency = row.avgLatencyMs == null ? null : formatDuration(row.avgLatencyMs);

  const tiles: Tile[] = [
    { labelKey: AnalyticsUsageI18nKey.PanelCalls, value: calls },
    {
      labelKey: AnalyticsUsageI18nKey.PanelShareOfCalls,
      value: row.share == null ? '—' : formatPercent(row.share),
    },
    {
      labelKey: AnalyticsUsageI18nKey.ColumnErrorRate,
      value: row.errorRate == null ? '—' : formatPercent(row.errorRate, 2),
    },
    {
      labelKey: AnalyticsUsageI18nKey.ColumnAvgLatency,
      value: latency ? `${latency.value}${latency.unit ?? ''}` : '—',
    },
  ];

  return (
    <SidePanel label={row.displayLabel} isOpen onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 p-4">
        {tiles.map((tile) => (
          <div key={tile.labelKey} className="flex flex-col gap-1 rounded border border-secondary bg-layer-3 p-3">
            <span className="dial-tiny-text text-secondary">{t(tile.labelKey)}</span>
            <span className="dial-h2-text text-primary">{tile.value}</span>
          </div>
        ))}
      </div>
    </SidePanel>
  );
};

export default RowDetailPanel;
