'use client';

import { DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconBlocks } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { installImage } from '@/src/app/actions/deployments';
import EntityBanner from '@/src/components/Deployments/Common/EntityBanner/EntityBanner';
import ImageInstall from '@/src/components/Deployments/Modals/ImageInstall';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { Image } from '@/src/models/deployments/images';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';
import { isImageNotInstalled } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface Props {
  image?: Image;
}

const ImageStatusBanner: FC<Props> = ({ image }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const onOpenModal = useCallback(() => setIsInstallModalOpen(true), []);
  const onCloseModal = useCallback(() => setIsInstallModalOpen(false), []);

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

  if (!image || !isImageNotInstalled(image)) {
    return null;
  }

  const messageKey =
    image.buildStatus === IMAGE_STATUS.BUILD_FAILED
      ? ContainersI18nKey.ImageBuildFailedWarning
      : ContainersI18nKey.ImageNotInstalledWarning;

  return (
    <>
      <EntityBanner
        className="mb-8"
        message={t(messageKey, { imageName: image.name ?? '', imageVersion: image.version })}
      >
        {!isReadOnlyAdmin && (
          <DialNeutralButton
            className="shrink-0"
            size={ElementSize.Small}
            label={t(ContainersI18nKey.InstallImage)}
            iconBefore={<IconBlocks size={12} />}
            onClick={onOpenModal}
          />
        )}
      </EntityBanner>

      {isInstallModalOpen &&
        createPortal(
          <ImageInstall
            isModalOpen={isInstallModalOpen}
            title={t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(getRouteByType(image.$type), t) })}
            onClose={onCloseModal}
            onApply={onInstallImage}
            image={image}
          />,
          document.body,
        )}
    </>
  );
};

export default ImageStatusBanner;
