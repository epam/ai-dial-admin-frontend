import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { DialButton, DialLabelledText, DialTooltip } from '@epam/ai-dial-ui-kit';
import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/src/context/NotificationContext';
import { updateContainer } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { BasicI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import StatusIndicator from '@/src/components/Common/StatusIndicator/StatusIndicator';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import ContainerProperties from '@/src/components/Containers/Properties/ContainerProperties';
import ChangeContainerImage from '@/src/components/Containers/Modals/ChangeContainerImage';

interface Props {
  container: Container;
  image: Image;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  names: string[];
  originalName: string;
}

const Properties: FC<Props> = ({ container, setContainer, image, route, names, originalName }) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
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
      <div className="flex flex-col pt-3 divide-y divide-primary w-full">
        <div className="flex gap-10 overflow-y-scroll">
          <DialLabelledText label={t(BasicI18nKey.ID)} text={originalName} />
          <DialLabelledText label={t(BasicI18nKey.Type)} text={t(ContainersI18nKey.Container)} />
          {container.status !== CONTAINER_STATUS.RUNNING && container.status !== CONTAINER_STATUS.PENDING ? (
            <DialLabelledText label={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })}>
              <DialButton
                label={`${image.name} (${image.version})`}
                textClassName={'text-primary text-base font-normal'}
                className={'text-secondary whitespace-nowrap'}
                onClick={handleModalOpen}
                iconAfter={<OpenPopup {...BASE_ICON_PROPS} className={'inline'} />}
              />
            </DialLabelledText>
          ) : (
            <DialLabelledText
              label={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) })}
              text={`${image.name} (${image.version})`}
            />
          )}
          <DialLabelledText
            label={t(BasicI18nKey.CreateTime)}
            text={formatDateTimeToLocalString(container?.createdAt)}
          />
          <DialLabelledText
            label={t(BasicI18nKey.UpdatedTime)}
            text={formatDateTimeToLocalString(container?.updatedAt)}
          />
          <DialLabelledText label={t(BasicI18nKey.Status)}>
            <StatusIndicator status={container.status} />
          </DialLabelledText>
          {container.status === CONTAINER_STATUS.RUNNING && container.url && (
            <DialLabelledText label={t(BasicI18nKey.URL)}>
              <p className="flex items-center gap-2 max-w-[360px]">
                <DialTooltip tooltip={container.url}>
                  <span className="truncate">{container.url}</span>
                </DialTooltip>
                <CopyButton field={container.url} label={t(BasicI18nKey.URL)} />
              </p>
            </DialLabelledText>
          )}
        </div>
        <div className="mt-8 pt-8">
          <ContainerProperties container={container} setContainer={setContainer} route={route} names={names} />
        </div>
      </div>
      {isModalOpen &&
        createPortal(
          <ChangeContainerImage
            modalTitle={t(ContainersI18nKey.AddModalTitle, { type: getTranslatedType(route, t) })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onApply}
            image={image}
            route={route}
          />,
          document.body,
        )}
    </>
  );
};

export default Properties;
