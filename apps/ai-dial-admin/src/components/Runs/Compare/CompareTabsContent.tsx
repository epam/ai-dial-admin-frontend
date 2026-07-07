'use client';

import { FC } from 'react';

import { CompareViewTab } from '@/src/components/Runs/Compare/constants';
import ExecutionResultsTab from '@/src/components/Runs/Compare/ExecutionResults/ExecutionResultsTab';
import HeatMapTab from '@/src/components/Runs/Compare/HeatMap/HeatMapTab';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

interface Props {
  activeTab: CompareViewTab;
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  colorDisplayMode: HeatMapColorDisplayMode;
  onColorDisplayModeChange: (mode: HeatMapColorDisplayMode) => void;
  showDisplayPanel: boolean;
  onToggleDisplayPanel: () => void;
  selectedRow: CompareAnalyticsRow | null;
  onOpenRowDetail: (row: CompareAnalyticsRow) => void;
  onCloseRowDetail: () => void;
}

const CompareTabsContent: FC<Props> = ({
  activeTab,
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  colorDisplayMode,
  onColorDisplayModeChange,
  showDisplayPanel,
  onToggleDisplayPanel,
  selectedRow,
  onOpenRowDetail,
}) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {activeTab === CompareViewTab.SummaryOverview && <div className="size-full" />}
      {activeTab === CompareViewTab.HeatMap && (
        <HeatMapTab
          primaryRunId={primaryRunId}
          comparedRunId={comparedRunId}
          colorDisplayMode={colorDisplayMode}
          onColorDisplayModeChange={onColorDisplayModeChange}
        />
      )}
      {activeTab === CompareViewTab.ExecutionResults && (
        <ExecutionResultsTab
          primaryRunId={primaryRunId}
          comparedRunId={comparedRunId}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          showDisplayPanel={showDisplayPanel}
          onToggleDisplayPanel={onToggleDisplayPanel}
          selectedRow={selectedRow}
          onOpenRowDetail={onOpenRowDetail}
        />
      )}
    </div>
  );
};

export default CompareTabsContent;
