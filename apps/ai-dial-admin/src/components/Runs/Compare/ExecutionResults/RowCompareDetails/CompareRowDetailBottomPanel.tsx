'use client';

import { ColDef } from 'ag-grid-community';
import { FC } from 'react';

import CompareRowDetailPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPanel';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { RowDetailFieldSchema } from '@/src/components/Runs/Details/RowDetails/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

interface Props {
  row: CompareAnalyticsRow;
  primaryRunName: string;
  comparedRunName: string;
  onClose: () => void;
  onSwitchToSidebar: () => void;
  focusFieldKey?: string | null;
  fieldSchema?: RowDetailFieldSchema;
  metricGroupOrder?: readonly string[];
  initialDisplayTree?: ColDef[];
  onDisplayTreeChange?: (tree: ColDef[]) => void;
  initialViewDifferencesOnly?: boolean;
  onViewDifferencesOnlyChange?: (value: boolean) => void;
  initialHideHighlights?: boolean;
  onHideHighlightsChange?: (value: boolean) => void;
}

const CompareRowDetailBottomPanel: FC<Props> = ({
  row,
  primaryRunName,
  comparedRunName,
  onClose,
  onSwitchToSidebar,
  focusFieldKey,
  fieldSchema,
  metricGroupOrder,
  initialDisplayTree,
  onDisplayTreeChange,
  initialViewDifferencesOnly,
  onViewDifferencesOnlyChange,
  initialHideHighlights,
  onHideHighlightsChange,
}) => {
  return (
    <div className="flex flex-col size-full bg-layer-0 overflow-hidden">
      <CompareRowDetailPanel
        row={row}
        primaryRunName={primaryRunName}
        comparedRunName={comparedRunName}
        onClose={onClose}
        position={SidebarPosition.Bottom}
        onSwitchDisplayMode={onSwitchToSidebar}
        focusFieldKey={focusFieldKey}
        fieldSchema={fieldSchema}
        metricGroupOrder={metricGroupOrder}
        initialDisplayTree={initialDisplayTree}
        onDisplayTreeChange={onDisplayTreeChange}
        initialViewDifferencesOnly={initialViewDifferencesOnly}
        onViewDifferencesOnlyChange={onViewDifferencesOnlyChange}
        initialHideHighlights={initialHideHighlights}
        onHideHighlightsChange={onHideHighlightsChange}
      />
    </div>
  );
};

export default CompareRowDetailBottomPanel;
