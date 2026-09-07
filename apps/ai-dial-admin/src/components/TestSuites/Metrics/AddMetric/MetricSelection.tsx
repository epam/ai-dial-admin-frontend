'use client';

import { FC, useCallback, useMemo } from 'react';

import { FirstDataRenderedEvent, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import { TWO_LINE_ROW_HEIGHT } from '@/src/components/Grid/constants';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION_NO_CHECKBOX } from '@/src/constants/ag-grid';
import { METRIC_SELECTION_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';

interface Props {
  selectedMetricId?: string;
  metrics: Metric[];
  onSelectMetric?: (metricId: string) => void;
}

const MetricSelection: FC<Props> = ({ metrics, selectedMetricId, onSelectMetric }) => {
  const t = useI18n();

  const columnDefs = useMemo(() => METRIC_SELECTION_COLUMNS(t), [t]);

  const onRowSelected = useCallback(
    (event: RowSelectedEvent<Metric>) => {
      event.api.refreshCells({ rowNodes: [event.node], columns: ['displayName'], force: true });

      if (event.node.isSelected() && event.data) {
        onSelectMetric?.(event.data.id ?? '');
      }
    },
    [onSelectMetric],
  );

  const onFirstDataRendered = useCallback(
    (event: FirstDataRenderedEvent<Metric>) => {
      if (!selectedMetricId) {
        return;
      }

      event.api.forEachNode((node) => {
        if (node.data?.id === selectedMetricId) {
          node.setSelected(true);
          event.api.ensureNodeVisible(node, 'middle');
        }
      });
    },
    [selectedMetricId],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      ...SINGLE_ROW_SELECTION_NO_CHECKBOX,
      rowHeight: TWO_LINE_ROW_HEIGHT,
      onRowSelected,
      onFirstDataRendered,
    }),
    [onRowSelected, onFirstDataRendered],
  );

  return (
    <div className="h-full flex flex-col gap-3">
      <p className="dial-body-semi">{t(TabsI18nKey.Metrics)}</p>

      <div className="flex-1 min-h-0">
        <GridView
          columnDefs={columnDefs}
          rowData={metrics}
          additionalGridOptions={additionalGridOptions}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoMetrics) }}
        />
      </div>
    </div>
  );
};
export default MetricSelection;
