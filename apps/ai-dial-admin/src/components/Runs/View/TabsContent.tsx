'use client';

import { FC } from 'react';

import { Run } from '@/src/models/evaluation/run';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ExtractionResultTab from './ExtractionResult';
import SummaryTab from '../Summary/SummaryTab';
import { UseRunViewTabStateReturn } from './use-run-view-tab-state';

interface Props {
  activeTab: EntityViewTab;
  run: Run;
  tabState: UseRunViewTabStateReturn;
}

const TabsContent: FC<Props> = ({ activeTab, run, tabState }) => {
  return (
    <>
      {activeTab === EntityViewTab.Summary && (
        <SummaryTab run={run} summaryState={tabState.state.summary} setSummaryState={tabState.setSummaryState} />
      )}
      {activeTab === EntityViewTab.ExtractionResult && (
        <ExtractionResultTab
          run={run}
          extractionResultState={tabState.state.extractionResult}
          setExtractionResultState={tabState.setExtractionResultState}
        />
      )}
    </>
  );
};

export default TabsContent;
