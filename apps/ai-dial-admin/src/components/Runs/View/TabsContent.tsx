'use client';

import { FC } from 'react';

import { Run } from '@/src/models/evaluation/run';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ExtractionResultTab from './ExtractionResult';
import SummaryTab from '../Summary/SummaryTab';

interface Props {
  activeTab: EntityViewTab;
  run: Run;
}

const TabsContent: FC<Props> = ({ activeTab, run }) => {
  return (
    <>
      {activeTab === EntityViewTab.Summary && <SummaryTab run={run} />}
      {activeTab === EntityViewTab.ExtractionResult && <ExtractionResultTab run={run} />}
    </>
  );
};

export default TabsContent;
