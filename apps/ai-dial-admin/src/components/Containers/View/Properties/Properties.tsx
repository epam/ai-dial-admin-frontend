import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { updateContainer } from '@/src/app/actions/deployments';
import { BasicI18nKey, ContainersI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification } from '@/src/utils/notification';
import { DialLabelledText } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import ContainerProperties from '@/src/components/Containers/Fields/ContainerProperties';
import ServingProperties from '@/src/components/Containers/Fields/ServingProperties';
import ChangeContainerImage from '@/src/components/Containers/Modals/ChangeContainerImage';
import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';

interface Props {
  container: Container;
  image?: Image;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  names: string[];
  originalName: string;
  restarts: number;
}

const Properties: FC<Props> = ({ container, setContainer, image, route, names, originalName, restarts }) => {
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

  const onApply = useCallback(
    (id: string) => {
      updateContainer({ ...container, imageDefinitionId: id }).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [container, router, showNotification],
  );

  return (
    <>
      <div className="flex flex-col h-full w-full">
        <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
          <LabelledText label={t(EntityFieldsI18nKey.id)} text={originalName} tooltip={originalName} copyable={true} />
          <DialLabelledText label={t(EntityFieldsI18nKey.type)} text={t(ContainersI18nKey.Container)} />
          {image && (
            <DialLabelledText
              label={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })}
              text={`${image.name} (${image.version})`}
              postfix={<OpenPopup {...BASE_BUTTON_ICON_PROPS} className="inline ml-2" onClick={handleModalOpen} />}
            />
          )}
          <DialLabelledText
            label={t(EntityFieldsI18nKey.createdAt)}
            text={formatDateTimeToLocalString(container?.createdAt)}
          />
          <DialLabelledText
            label={t(EntityFieldsI18nKey.updatedAt)}
            text={formatDateTimeToLocalString(container?.updatedAt)}
          />
          <DialLabelledText label={t(EntityFieldsI18nKey.status)}>
            <StatusIndicator status={container.status} />
          </DialLabelledText>
          {container.status === CONTAINER_STATUS.RUNNING && container.url && (
            <LabelledText label={t(BasicI18nKey.URL)} text={container.url} copyable />
          )}
          {!!restarts && <LabelledText label={t(EntityFieldsI18nKey.Restarts)} text={`${restarts}`} />}
        </div>
        <div className="flex-1 min-h-0 pt-8">
          {route === ApplicationRoute.ModelServings ? (
            <ServingProperties container={container} setContainer={setContainer} names={names} route={route} />
          ) : (
            <ContainerProperties container={container} setContainer={setContainer} route={route} names={names} />
          )}
        </div>
      </div>
      {isModalOpen &&
        image &&
        createPortal(
          <ChangeContainerImage
            modalTitle={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onApply}
            image={image}
            route={route}
            containerStatus={container.status}
          />,
          document.body,
        )}
    </>
  );
};

export default Properties;
