'use client';

import { FC } from 'react';

import { CompareViewTab } from '@/src/components/Runs/Compare/constants';
import ExecutionResultsTab from '@/src/components/Runs/Compare/ExecutionResults/ExecutionResultsTab';
import HeatMapTab from '@/src/components/Runs/Compare/HeatMap/HeatMapTab';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { ExecutionResultsTabUiState, HeatMapTabUiState } from '@/src/components/Runs/Compare/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

interface Props {
  activeTab: CompareViewTab;
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  colorDisplayMode: HeatMapColorDisplayMode;
  onColorDisplayModeChange: (mode: HeatMapColorDisplayMode) => void;
  selectedMetricGroups: Set<string>;
  onAvailableMetricGroupsChange: (groups: string[]) => void;
  showDisplayPanel: boolean;
  onToggleDisplayPanel: () => void;
  selectedRow: CompareAnalyticsRow | null;
  onOpenRowDetail: (row: CompareAnalyticsRow) => void;
  onCloseRowDetail: () => void;
  executionResultsState: ExecutionResultsTabUiState;
  setExecutionResultsState: (patch: Partial<ExecutionResultsTabUiState>) => void;
  heatMapState: HeatMapTabUiState;
  setHeatMapState: (patch: Partial<HeatMapTabUiState>) => void;
}

const CompareTabsContent: FC<Props> = ({
  activeTab,
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  colorDisplayMode,
  onColorDisplayModeChange,
  selectedMetricGroups,
  onAvailableMetricGroupsChange,
  showDisplayPanel,
  onToggleDisplayPanel,
  selectedRow,
  onOpenRowDetail,
  executionResultsState,
  setExecutionResultsState,
  heatMapState,
  setHeatMapState,
}) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {activeTab === CompareViewTab.SummaryOverview && <div className="size-full" />}
      {activeTab === CompareViewTab.HeatMap && (
        <HeatMapTab
          primaryRunId={primaryRunId}
          comparedRunId={comparedRunId}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          colorDisplayMode={colorDisplayMode}
          onColorDisplayModeChange={onColorDisplayModeChange}
          selectedMetricGroups={selectedMetricGroups}
          onAvailableMetricGroupsChange={onAvailableMetricGroupsChange}
          heatMapState={heatMapState}
          setHeatMapState={setHeatMapState}
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
          executionResultsState={executionResultsState}
          setExecutionResultsState={setExecutionResultsState}
        />
      )}
    </div>
  );
};

export default CompareTabsContent;
