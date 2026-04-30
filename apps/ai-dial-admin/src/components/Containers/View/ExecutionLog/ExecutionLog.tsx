import { FC, useCallback, useEffect, useState } from 'react';
import { DialCollapsibleSidebar, DialNoDataContent, DialTabs, TabModel, TabOrientation } from '@epam/ai-dial-ui-kit';

import { Container, Pod } from '@/src/models/deployments/containers';
import { ContainersI18nKey, DeploymentsI18nKey, EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { ApplicationRoute } from '@/src/types/routes';

import { useI18n } from '@/src/locales/client';

import BlockedDomainBanner from '@/src/components/Deployments/Common/BlockedDomainBanner/BlockedDomainBanner';
import PodView from '@/src/components/Containers/View/ExecutionLog/PodView';
import { mergeAllowedDomains } from '@/src/utils/deployments/whitelist';
import { getTranslatedDeploymentType } from '@/src/utils/deployments/entity';

interface Props {
  route: ApplicationRoute;
  pods: Pod[];
  selectedContainer: Container;
  onChange: (container: Container) => void;
  setHasBlockedDomains: (value: boolean) => void;
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

const ExecutionLog: FC<Props> = ({ route, pods, selectedContainer, onChange, setHasBlockedDomains }) => {
  const t = useI18n();

  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);

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

  const onBlockedDomain = useCallback(
    (domain: string) => {
      if (selectedContainer.allowedDomains?.includes(domain)) return;
      setBlockedDomains((prev) => (prev.includes(domain) ? prev : [...prev, domain]));
      setHasBlockedDomains(true);
    },
    [selectedContainer.allowedDomains, setHasBlockedDomains],
  );

  const onAddToAllowed = useCallback(() => {
    onChange({
      ...selectedContainer,
      allowedDomains: mergeAllowedDomains(selectedContainer.allowedDomains, blockedDomains),
    });
    setBlockedDomains([]);
    setHasBlockedDomains(false);
  }, [blockedDomains, onChange, selectedContainer, setHasBlockedDomains]);

  return (
    <div className="flex flex-col size-full gap-4">
      {blockedDomains.length > 0 && (
        <BlockedDomainBanner
          message={t(ContainersI18nKey.BlockedDomainsInRun, { domains: blockedDomains.join(', ') })}
          buttonLabel={t(DeploymentsI18nKey.AddToAllowedDomains)}
          onAddToAllowed={onAddToAllowed}
        />
      )}
      {tabs.length ? (
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
            containerId={selectedContainer.name}
            route={route}
            onBlockedDomain={onBlockedDomain}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <DialNoDataContent
            title={t(EntitiesI18nKey.NoContainerLogs, { entityType: getTranslatedDeploymentType(route, t) })}
          />
        </div>
      )}
    </div>
  );
};

export default ExecutionLog;
