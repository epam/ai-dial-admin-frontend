'use client';

import { FC } from 'react';

import { CompareViewTab } from '@/src/components/Runs/Compare/constants';
import ExecutionResultsTab from '@/src/components/Runs/Compare/ExecutionResults/ExecutionResultsTab';

interface Props {
  activeTab: CompareViewTab;
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  showDisplayPanel: boolean;
  onToggleDisplayPanel: () => void;
}

const CompareTabsContent: FC<Props> = ({
  activeTab,
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  showDisplayPanel,
  onToggleDisplayPanel,
}) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {activeTab === CompareViewTab.SummaryOverview && <div className="size-full" />}
      {activeTab === CompareViewTab.MetricsDetails && <div className="size-full" />}
      {activeTab === CompareViewTab.ExecutionResults && (
        <ExecutionResultsTab
          primaryRunId={primaryRunId}
          comparedRunId={comparedRunId}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          showDisplayPanel={showDisplayPanel}
          onToggleDisplayPanel={onToggleDisplayPanel}
        />
      )}
    </div>
  );
};

export default CompareTabsContent;
