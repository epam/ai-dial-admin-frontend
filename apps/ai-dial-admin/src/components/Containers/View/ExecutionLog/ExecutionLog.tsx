import { FC, useCallback, useEffect, useState } from 'react';
import { DialNoDataContent, DialTabs, TabModel } from '@epam/ai-dial-ui-kit';

import { Pod } from '@/src/models/deployments/containers';
import { ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { getTranslatedDeploymentType } from '@/src/utils/deployments/entity';
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
    label: `${t(ContainersI18nKey.Pod)} ${index + 1}`,
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
    <div className="flex h-full">
      {!tabs.length ? (
        <DialNoDataContent
          title={t(EntitiesI18nKey.NoContainerLogs, { entityType: getTranslatedDeploymentType(route, t) })}
        />
      ) : (
        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {tabs.length > 1 && (
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} desktopTabClassName="mb-4" />
          )}
          <PodView pod={pods.find((pod) => pod.name === activeTab) as Pod} containerId={containerId} />
        </div>
      )}
    </div>
  );
};

export default ExecutionLog;
