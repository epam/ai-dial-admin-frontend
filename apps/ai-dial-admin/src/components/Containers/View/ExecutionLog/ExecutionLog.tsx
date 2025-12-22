import { FC, useCallback, useEffect, useState } from 'react';
import { DialNoDataContent, DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import { Pod } from '@/src/models/deployments/containers';
import { ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { getContainerPods } from '@/src/app/actions/deployments';
import Page403 from '@/src/components/Page403/Page403';
import LogViewer from '@/src/components/Common/LogViewer/LogViewer';
import { getTranslatedDeploymentType } from '@/src/utils/deployments/entity';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  containerId?: string;
  route: ApplicationRoute;
}

function getPodsTabs(pods: Pod[], t: (key: string) => string): TabModel[] {
  return pods.map((pod: Pod, index) => ({
    id: pod?.name || `${index}`,
    label: `${t(ContainersI18nKey.Pod)} ${index + 1}`,
  }));
}

const ExecutionLog: FC<Props> = ({ containerId, route }) => {
  const t = useI18n();
  const [pods, setPods] = useState<Pod[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [logs, setLogs] = useState('');

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

  useEffect(() => {
    if (containerId && activeTab) {
      const eventSource = new EventSource(`/api/sse?entity=container&id=${containerId}&podName=${activeTab}`);

      eventSource.addEventListener('logs', (event) => {
        setLogs((prev) => prev + event.data + '\n');
      });

      return () => {
        eventSource.close();
      };
    }
  }, [activeTab, containerId]);

  useEffect(() => {
    const fetchPods = async () => {
      if (containerId) {
        const data = await getContainerPods(containerId);
        if (data === void 0) {
          return <Page403 />;
        }
        setPods(data || []);
      }
    };

    fetchPods();
  }, [containerId]);

  return (
    <div className="flex h-full">
      {!tabs.length ? (
        <DialNoDataContent
          title={t(EntitiesI18nKey.NoContainerLogs, { entityType: getTranslatedDeploymentType(route, t) })}
        />
      ) : (
        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {tabs.length > 1 && <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />}
          <div className="h-full mt-3">
            <LogViewer logs={logs} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionLog;
