'use client';

import { FC, useCallback, useState } from 'react';

import Grafana from '@/public/images/icons/grafana.svg';
import { Entity } from '@epam/ai-dial-shared';
import { DialLinkButton } from '@epam/ai-dial-ui-kit';

import RunHeader from '@/src/components/EntityHeaderControls/RunHeader';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getRunTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  run: Run;
  onRemove: (id: string) => Promise<ServerActionResponse>;
}

const RunView: FC<Props> = ({ run, onRemove }) => {
  const t = useI18n();
  const tabs = getRunTabs(t).splice(1); // remove properties tab, todo: return it when it will be ready
  const [activeTab, setActiveTab] = useState(tabs[0].id as EntityViewTab);

  const noop = useCallback(() => {}, []);
  // todo: return original markup when properties tab will be ready
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      {/* <SimpleEntityHeader
        view={ApplicationRoute.Runs}
        entity={run}
        isChanged={false}
        onDiscard={noop}
        onSave={noop}
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={onRemove}
      >
        {run.grafanaExploreUrl && (
          <DialLinkButton
            iconBefore={<Grafana />}
            label={t(RunsI18nKey.GrafanaRun)}
            onClick={() => window.open(run.grafanaExploreUrl, '_blank')}
          />
        )}
      </SimpleEntityHeader> */}

      <RunHeader
        view={ApplicationRoute.Runs}
        entity={run as Entity}
        tabs={tabs}
        isChanged={false}
        onDiscard={noop}
        onSave={noop}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={onRemove}
      >
        {run.grafanaExploreUrl && (
          <DialLinkButton
            iconBefore={<Grafana />}
            label={t(RunsI18nKey.GrafanaRun)}
            onClick={() => window.open(run.grafanaExploreUrl, '_blank')}
          />
        )}
      </RunHeader>

      <div className="flex-1 overflow-auto min-h-0">
        <TabsContent run={run} activeTab={activeTab} />
      </div>
    </div>
  );
};

export default RunView;
