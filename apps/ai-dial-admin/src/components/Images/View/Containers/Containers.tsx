import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { useRouter } from 'next/navigation';
import { Container } from '@/src/models/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { getImageContainers, updateContainersImageId } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import ListView from '@/src/components/ListView/ListView';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { createPortal } from 'react-dom';
import AddContainerToImage from '@/src/components/Images/Modals/AddContainerToImage';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  image: Image;
  route: ApplicationRoute;
  versions: ImageVersion[];
}

const Containers: FC<Props> = ({ image, route, versions }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containers, setContainers] = useState<Container[]>([]);

  const installed = useMemo(() => image.buildStatus === IMAGE_STATUS.BUILT, [image]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onOpenInNewTabAction = useCallback(
    (container?: Container) => {
      //TODO: route by type
      onOpenInNewTab(route, container);
    },
    [route],
  );

  const updateImageId = useCallback(
    (containers: Container[]) => {
      const ids = containers.map((c) => c.id as string);
      updateContainersImageId(ids, image.id).then((res) => {
        if (!res.success) {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
        handleModalClose();
        router.refresh();
      });
    },
    [handleModalClose, image.id, router, showNotification],
  );

  const columnDefs = [
    ...IMAGE_DEPENDENCIES_COLUMNS(t),
    ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction)]),
  ];

  useEffect(() => {
    getImageContainers(image?.id as string).then(({ response, success, errorMessage, errorHeader, requestId }) => {
      if (success) {
        setContainers((response as Container[]) || []);
      } else {
        showNotification(getErrorNotification(errorHeader, errorMessage, requestId, 5000));
      }
    });
  }, [image, showNotification]);

  return (
    <div className="flex h-full">
      <ListView
        data={containers}
        view={route}
        columnDefs={columnDefs}
        title={
          installed
            ? t(ContainersI18nKey.RelatedContainersListTitle, {
                count: containers.length,
              })
            : ''
        }
        emptyDataTitle={t(EntitiesI18nKey.NoRelatedContainers)}
        emptyDataDescription={!installed ? t(EntitiesI18nKey.NoRelatedContainersDescription) : ''}
        storageKey={`${route}/related`}
      >
        {installed && (
          <DialButton variant={ButtonVariant.Primary} label={t(ButtonsI18nKey.Add)} onClick={handleModalOpen} />
        )}
      </ListView>
      {isModalOpen &&
        createPortal(
          <AddContainerToImage
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={updateImageId}
            title={t(ContainersI18nKey.AddModalTitle, { type: getTranslatedType(route, t) })}
            imageId={image.id}
            route={route}
            versions={versions}
          />,
          document.body,
        )}
    </div>
  );
};

export default Containers;
