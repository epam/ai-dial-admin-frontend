import { FC, useCallback, useEffect, useState } from 'react';
import { DialCollapsibleSidebar, DialTabs, TabModel, TabOrientation } from '@epam/ai-dial-ui-kit';

import { Pod } from '@/src/models/deployments/containers';
import { ContainersI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { ApplicationRoute } from '@/src/types/routes';

import { useI18n } from '@/src/locales/client';

import PodView from '@/src/components/Containers/View/ExecutionLog/PodView';

interface Props {
  containerId?: string;
  route: ApplicationRoute;
  pods: Pod[];
}

function getPodsTabs(pods: Pod[], t: (key: string) => string): TabModel[] {
  return pods.map((pod: Pod, index) => ({
    id: pod?.name || `${index}`,
    label: (
      <div className="flex w-full tiny justify-between">
        {`${t(ContainersI18nKey.Pod)} ${index + 1}`}
        {!!pod?.restartCount && (
          <p>
            <span className="text-secondary">{`${t(EntityFieldsI18nKey.Restarts)}:`}</span>
            <span className="text-primary pl-1">{pod?.restartCount}</span>
          </p>
        )}
      </div>
    ),
  }));
}

const ExecutionLog: FC<Props> = ({ containerId, route, pods }) => {
  const t = useI18n();

  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        setActiveTab(tab as EntityViewTab);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    if (pods.length) {
      const tabs = getPodsTabs(pods, t);
      setActiveTab(tabs[0].id);
      setTabs(tabs);
    }
  }, [pods, t]);

  return (
    <div className="flex flex-col h-full w-full">
      {!!tabs.length && (
        <div className="flex h-full min-h-0 gap-8">
          {tabs.length > 1 && (
            <DialCollapsibleSidebar
              width={320}
              title={t(ContainersI18nKey.Pods)}
              containerClassName="bg-layer-3 border-transparent mr-0"
              iconSize={24}
            >
              <DialTabs
                tabs={tabs}
                activeTab={activeTab}
                onClick={onChangeActiveTab}
                orientation={TabOrientation.Vertical}
                desktopTabClassName="[&>span]:max-w-[320px]"
              />
            </DialCollapsibleSidebar>
          )}
          <PodView
            pod={pods.find((pod) => pod.name === activeTab) ?? pods[0]}
            containerId={containerId}
            route={route}
          />
        </div>
      )}
    </div>
  );
};

export default ExecutionLog;
