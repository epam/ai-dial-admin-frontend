import { DialInputPopup, DialLabel } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useState } from 'react';

import { updateContainer } from '@/src/app/actions/deployments';
import WarningIcon from '@/src/components/Common/WarningIcon/WarningIcon';
import ContainerChangeImage from '@/src/components/Deployments/Modals/ContainerChangeImage';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { isImageNotInstalled } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  container: Container;
  image?: Image;
  route: ApplicationRoute;
  disabled?: boolean;
}

const InternalImageField: FC<Props> = ({ container, image, route, disabled }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const label = t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) });
  const selectedValue = image ? `${image.name} (${image.version})` : undefined;
  const isChangeDisabled = disabled || !image;

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const onApply = useCallback(
    (id: string) => {
      updateContainer({
        ...container,
        source: { ...container.source, imageDefinitionId: id },
      }).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [container, router, showNotification],
  );

  return (
    <div className={`${CONTROL_WITH_BUTTON_WIDTH} flex flex-col gap-y-1`}>
      <DialLabel label={label} htmlFor="internalImage" />
      <DialInputPopup
        open={isModalOpen}
        onOpen={onOpenModal}
        selectedValue={selectedValue}
        elementId="internalImage"
        disabled={isChangeDisabled}
        iconBefore={
          isImageNotInstalled(image) ? (
            <WarningIcon warningText={t(ContainersI18nKey.ImageNotInstalledTooltip)} />
          ) : undefined
        }
      >
        {isModalOpen && image && (
          <ContainerChangeImage
            modalTitle={label}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onApply}
            image={image}
            route={route}
            containerStatus={container.status}
          />
        )}
      </DialInputPopup>
    </div>
  );
};

export default InternalImageField;
