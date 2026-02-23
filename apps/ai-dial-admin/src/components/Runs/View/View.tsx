'use client';

import { FC, useCallback, useState } from 'react';

import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getRunTabs } from '@/src/utils/tabs/utils';
import { ServerActionResponse } from '@/src/models/server-action';
import TabsContent from './TabsContent';

interface Props {
  run: Run;
  onRemove: (id: string) => Promise<ServerActionResponse>;
}

const RunView: FC<Props> = ({ run, onRemove }) => {
  const t = useI18n();
  const tabs = getRunTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Summary);

  const noop = useCallback(() => {}, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Runs}
        entity={run}
        isChanged={false}
        onDiscard={noop}
        onSave={noop}
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={onRemove}
      />

      <div className="flex-1 overflow-auto min-h-0">
        <TabsContent run={run} activeTab={activeTab} />
      </div>
    </div>
  );
};

export default RunView;
