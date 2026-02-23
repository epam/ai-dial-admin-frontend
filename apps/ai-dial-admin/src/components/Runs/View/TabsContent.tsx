'use client';

import { FC } from 'react';

import { Run } from '@/src/models/evaluation/run';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { ApplicationRoute } from '@/src/types/routes';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import ExtractionResult from './ExtractionResult';

interface Props {
  run: Run;
  activeTab: EntityViewTab;
}

const TabsContent: FC<Props> = ({ run, activeTab }) => {
  return (
    <>
      {activeTab === EntityViewTab.ExtractionResult && <ExtractionResult run={run} />}

      {activeTab === EntityViewTab.Summary && (
        <PropertiesTabContent entity={run} view={ApplicationRoute.Runs}>
          <div></div>
        </PropertiesTabContent>
      )}
    </>
  );
};

export default TabsContent;
