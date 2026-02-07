import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { updateContainer } from '@/src/app/actions/deployments';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import Events from '@/src/components/Containers/View/Events/Events';
import ExecutionLog from '@/src/components/Containers/View/ExecutionLog/ExecutionLog';
import FirewallSettings from '@/src/components/Containers/View/FirewallSettings/FirewallSettings';
import Metrics from '@/src/components/Containers/View/Metrics/Metrics';
import Prompts from '@/src/components/Containers/View/Prompts/Prompts';
import Properties from '@/src/components/Containers/View/Properties/Properties';
import Resources from '@/src/components/Containers/View/Resources/Resources';
import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import ContainerChangeImage from '@/src/components/Deployments/Modals/ContainerChangeImage';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import Tools from '@/src/components/Tools/Tools';
import { BasicI18nKey, ContainersI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Container, KubEvent, Pod } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { getErrorNotification } from '@/src/utils/notification';
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

  const router = useRouter();
  const { showNotification } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

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

  const headerPrefix = useMemo(() => {
    return (
      <>
        {image && (
          <DialLabelledText
            label={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })}
            text={`${image.name} (${image.version})`}
            postfix={<OpenPopup {...BASE_BUTTON_ICON_PROPS} className="inline ml-2" onClick={handleModalOpen} />}
          />
        )}
      </>
    );
  }, [handleModalOpen, image, route, t]);

  const onApply = useCallback(
    (id: string) => {
      updateContainer({ ...selectedContainer, imageDefinitionId: id }).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, selectedContainer, showNotification],
  );

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          entity={selectedContainer}
          view={route}
          id={selectedContainer.name}
          headerPostfix={headerPostfix}
          headerPrefix={headerPrefix}
        >
          <Properties container={selectedContainer} setContainer={onChange} route={route} names={names} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.Tools && <Tools containerId={selectedContainer.name} isMcpToolset />}
      {activeTab === EntityViewTab.Resources && <Resources containerId={selectedContainer.name} />}
      {activeTab === EntityViewTab.Prompts && <Prompts containerId={selectedContainer.name} />}
      {activeTab === EntityViewTab.Metrics && <Metrics />}
      {activeTab === EntityViewTab.ExecutionLog && (
        <ExecutionLog containerId={selectedContainer.name} route={route} pods={pods} />
      )}
      {activeTab === EntityViewTab.Events && <Events route={route} events={events} />}

      {activeTab === EntityViewTab.Firewall && (
        <FirewallSettings route={route} container={selectedContainer} setContainer={onChange} />
      )}

      {isModalOpen &&
        image &&
        createPortal(
          <ContainerChangeImage
            modalTitle={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onApply}
            image={image}
            route={route}
            containerStatus={selectedContainer.status}
          />,
          document.body,
        )}
    </>
  );
};

export default TabsContent;
