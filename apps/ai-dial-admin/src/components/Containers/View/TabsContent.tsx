import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import Events from '@/src/components/Containers/View/Events/Events';
import ExecutionLog from '@/src/components/Containers/View/ExecutionLog/ExecutionLog';
import FirewallSettings from '@/src/components/Containers/View/FirewallSettings/FirewallSettings';
import Metrics from '@/src/components/Containers/View/Metrics/Metrics';
import Prompts from '@/src/components/Containers/View/Prompts/Prompts';
import Properties from '@/src/components/Containers/View/Properties/Properties';
import Resources from '@/src/components/Containers/View/Resources/Resources';
import ImageStatusBanner from '@/src/components/Deployments/Common/ImageStatusBanner/ImageStatusBanner';
import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import Tools from '@/src/components/Tools/Tools';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { Container, KubEvent, Pod } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ActivityAuditView } from '@/src/types/activity-audit';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getContainerSourceTypeLabel } from '@/src/utils/deployments/containers';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  selectedContainer: Container;
  pods: Pod[];
  events: KubEvent[];
  route: ApplicationRoute;
  image?: Image;
  names: string[];
  restarts: number;
  onChange: (container: Container) => void;
}

const TabsContent: FC<Props> = ({
  activeTab,
  route,
  restarts,
  image,
  selectedContainer,
  pods,
  events,
  onChange,
  names,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const headerPostfix = useMemo(() => {
    return (
      <>
        <DialLabelledText label={t(EntityFieldsI18nKey.status)}>
          <StatusIndicator status={selectedContainer.status} />
        </DialLabelledText>
        {selectedContainer.status === CONTAINER_STATUS.RUNNING && selectedContainer.url && (
          <LabelledText label={t(BasicI18nKey.URL)} text={selectedContainer.url} copyable />
        )}
        {!!restarts && <LabelledText label={t(EntityFieldsI18nKey.Restarts)} text={`${restarts}`} />}
      </>
    );
  }, [restarts, selectedContainer.status, selectedContainer.url, t]);

  const headerPrefix = useMemo(
    () => (
      <DialLabelledText
        label={t(EntitiesI18nKey.SourceType)}
        text={getContainerSourceTypeLabel(selectedContainer.source, route, t)}
      />
    ),
    [route, selectedContainer.source, t],
  );

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <>
          <ImageStatusBanner image={image} />
          <PropertiesTabContent
            entity={selectedContainer}
            view={route}
            id={selectedContainer.name}
            headerPostfix={headerPostfix}
            headerPrefix={headerPrefix}
          >
            <Properties
              container={selectedContainer}
              setContainer={onChange}
              image={image}
              route={route}
              names={names}
            />
          </PropertiesTabContent>
        </>
      )}
      {activeTab === EntityViewTab.Tools && (
        <Tools containerId={selectedContainer.name} isMcpToolset disabled={isReadOnlyAdmin} />
      )}
      {activeTab === EntityViewTab.Resources && <Resources containerId={selectedContainer.name} />}
      {activeTab === EntityViewTab.Prompts && <Prompts containerId={selectedContainer.name} />}
      {activeTab === EntityViewTab.Metrics && <Metrics />}
      {activeTab === EntityViewTab.ExecutionLog && (
        <ExecutionLog containerId={selectedContainer.name} route={route} pods={pods} />
      )}
      {activeTab === EntityViewTab.Events && <Events route={route} events={events} />}

      {activeTab === EntityViewTab.Firewall && (
        <FirewallSettings
          route={route}
          container={selectedContainer}
          setContainer={onChange}
          disabled={isReadOnlyAdmin}
        />
      )}
      {activeTab === EntityViewTab.Audit && (
        <EntityAudit entity={selectedContainer} view={route} viewMode={ActivityAuditView.Deployments} />
      )}
    </>
  );
};

export default TabsContent;
