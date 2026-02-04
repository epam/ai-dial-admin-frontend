import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { createPortal } from 'react-dom';

import { Image, ImageVersion } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { useNotification } from '@/src/context/NotificationContext';
import { useRouter } from 'next/navigation';
import { getContainer, getImageContainers, updateContainersImageId } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';

import ListView from '@/src/components/ListView/ListView';
import ImageAddContainer from '@/src/components/Deployments/Modals/ImageAddContainer';

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
      onOpenInNewTab(getRouteByType(image.$type), container);
    },
    [image.$type],
  );

  const updateImageId = useCallback(
    (containers: Container[]) => {
      const ids = containers.map((c) => c.name as string);
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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const pendingContainers = containers.filter(
      (c) => c.status === CONTAINER_STATUS.PENDING || c.status === CONTAINER_STATUS.STOPPING,
    );

    if (pendingContainers.length) {
      interval = setInterval(async () => {
        const results = (await Promise.allSettled(pendingContainers.map((c) => getContainer(c?.name as string)))) || [];

        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            const container = res.value.response as Container;
            if (container?.status !== CONTAINER_STATUS.PENDING && container?.status !== CONTAINER_STATUS.STOPPING) {
              router.refresh();
            }
          }
        });
      }, IMAGE_BUILD_POLL_INTERVAL);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showNotification, route, t, router, containers]);

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
        {installed && <DialPrimaryButton label={t(ButtonsI18nKey.Add)} onClick={handleModalOpen} />}
      </ListView>
      {isModalOpen &&
        createPortal(
          <ImageAddContainer
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={updateImageId}
            title={t(ContainersI18nKey.AddModalTitle, { type: getTranslatedType(getRouteByType(image.$type), t) })}
            image={image}
            route={route}
            versions={versions}
          />,
          document.body,
        )}
    </div>
  );
};

export default Containers;
