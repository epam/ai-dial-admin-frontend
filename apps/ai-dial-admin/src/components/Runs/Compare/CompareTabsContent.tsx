'use client';

import { FC } from 'react';

import { CompareViewTab } from '@/src/components/Runs/Compare/constants';
import ExecutionResultsTab from '@/src/components/Runs/Compare/ExecutionResultsTab';

interface Props {
  activeTab: CompareViewTab;
  primaryRunId: string;
  comparedRunId: string;
}

const CompareTabsContent: FC<Props> = ({ activeTab, primaryRunId, comparedRunId }) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {activeTab === CompareViewTab.SummaryOverview && <div className="size-full" />}
      {activeTab === CompareViewTab.MetricsDetails && <div className="size-full" />}
      {activeTab === CompareViewTab.ExecutionResults && (
        <ExecutionResultsTab primaryRunId={primaryRunId} comparedRunId={comparedRunId} />
      )}
    </div>
  );
};

export default CompareTabsContent;
