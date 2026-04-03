import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { getContainer, getImageContainers, updateContainersImageId } from '@/src/app/actions/deployments';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { useRouter } from 'next/navigation';

import ImageAddContainer from '@/src/components/Deployments/Modals/ImageAddContainer';
import ListEntities from '@/src/components/ListView/List';

interface Props {
  image: Image;
  route: ApplicationRoute;
  versions: ImageVersion[];
  disabled?: boolean;
}

const Containers: FC<Props> = ({ image, route, versions, disabled }) => {
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
    ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction, t)]),
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
    <>
      <ListEntities
        rowData={containers}
        columnDefs={columnDefs}
        listLabel={
          installed
            ? t(ContainersI18nKey.RelatedContainersListTitle, {
                count: containers.length,
              })
            : ''
        }
        emptyDataProps={{
          title: t(EntitiesI18nKey.NoRelatedContainers),
          description: !installed ? t(EntitiesI18nKey.NoRelatedContainersDescription) : '',
        }}
        storageKey={`${route}/related`}
      >
        {installed && !disabled && <DialPrimaryButton label={t(ButtonsI18nKey.Add)} onClick={handleModalOpen} />}
      </ListEntities>
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
    </>
  );
};

export default Containers;
