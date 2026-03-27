import {
  AlertVariant,
  DialAlert,
  DialIconButton,
  DialLabelledText,
  DialNeutralButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { IconBlocks } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { installImage, updateContainer } from '@/src/app/actions/deployments';
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
import ImageInstall from '@/src/components/Deployments/Modals/ImageInstall';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import Tools from '@/src/components/Tools/Tools';
import { BasicI18nKey, ContainersI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { Container, KubEvent, Pod } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { isImageNotInstalled } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
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

  const router = useRouter();
  const { showNotification } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const isDisabled = useMemo(
    () => isReadOnlyAdmin || isEditDisabled(selectedContainer),
    [isReadOnlyAdmin, selectedContainer],
  );
  const imageWarning = isImageNotInstalled(image);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleInstallModalOpen = useCallback(() => {
    setIsInstallModalOpen(true);
  }, []);

  const handleInstallModalClose = useCallback(() => {
    setIsInstallModalOpen(false);
  }, []);

  const onInstallImage = useCallback(
    (img: Image) => {
      installImage(img.id).then((res) => {
        if (res.success) {
          router.push(getUrnForEntity(ApplicationRoute.Images, { id: img.id }));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, showNotification],
  );

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
            postfix={
              <DialIconButton
                className="size-auto ml-2 cursor-pointer text-secondary hover:text-accent-primary"
                icon={<OpenPopup {...BASE_BUTTON_ICON_PROPS} />}
                onClick={handleModalOpen}
                disabled={isDisabled}
              />
            }
          />
        )}
      </>
    );
  }, [isDisabled, handleModalOpen, image, route, t]);

  const onApply = useCallback(
    (id: string) => {
      updateContainer({
        ...selectedContainer,
        source: { ...selectedContainer.source, imageDefinitionId: id },
      }).then((res) => {
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
        <>
          {imageWarning && image && (
            <DialAlert
              className="[&>div]:flex-1 [&>div>div:last-child]:w-full mb-8"
              variant={AlertVariant.Warning}
              message={
                <div className="flex flex-row items-center justify-between gap-4 w-full">
                  <span className="small">
                    {t(
                      image.buildStatus === IMAGE_STATUS.BUILD_FAILED
                        ? ContainersI18nKey.ImageBuildFailedWarning
                        : ContainersI18nKey.ImageNotInstalledWarning,
                      { imageName: image.name ?? '', imageVersion: image.version },
                    )}
                  </span>
                  {!isReadOnlyAdmin && (
                    <DialNeutralButton
                      className="shrink-0"
                      size={ElementSize.Small}
                      label={t(ContainersI18nKey.InstallImage)}
                      iconBefore={<IconBlocks size={12} />}
                      onClick={handleInstallModalOpen}
                    />
                  )}
                </div>
              }
            />
          )}
          <PropertiesTabContent
            entity={selectedContainer}
            view={route}
            id={selectedContainer.name}
            headerPostfix={headerPostfix}
            headerPrefix={headerPrefix}
          >
            <Properties container={selectedContainer} setContainer={onChange} route={route} names={names} />
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
      {isInstallModalOpen &&
        image &&
        createPortal(
          <ImageInstall
            isModalOpen={isInstallModalOpen}
            title={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })}
            onClose={handleInstallModalClose}
            onApply={onInstallImage}
            image={image}
          />,
          document.body,
        )}
    </>
  );
};

export default TabsContent;
