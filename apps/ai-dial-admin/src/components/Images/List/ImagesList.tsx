'use client';
import { createImage, deleteImage, getImageVersions } from '@/src/app/actions/deployments';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { onCellClicked } from '@/src/components/EntityListView/utils/on-cell-clicked';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import {
  getDeleteOperation,
  getDuplicateOperation,
  getOpenInNewTabOperation,
} from '@/src/constants/grid-columns/actions';
import { IMAGES_LIST_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments/deployments';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getImageType, getUniqueImagesNames } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { CellClickedEvent, GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import ImageDelete from '@/src/components/Deployments/Modals/ImageDelete';
import ImageDuplicateModal from '@/src/components/Deployments/Modals/ImageDuplicate';
import HeaderButtons from '@/src/components/Images/List/HeaderButtons';
import ListEntities from '@/src/components/ListView/List';

interface Props {
  route: ApplicationRoute;
  imagesList: Image[];
}

const ImagesList: FC<Props> = ({ route, imagesList }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [modalType, setModalType] = useState<ModalType>();
  const [versions, setVersions] = useState<ImageVersion[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onOpenModal = useCallback(
    (modalType: ModalType) => {
      handleModalOpen();
      setModalType(modalType);
    },
    [handleModalOpen],
  );

  const onCloseModal = useCallback(() => {
    handleModalClose();
    setModalType(void 0);
  }, [handleModalClose]);

  const gridOptions: GridOptions = {
    onCellClicked: (e: CellClickedEvent) => onCellClicked(e, route, router.push),
  };

  const onDeleteAction = useCallback(
    (image?: Image) => {
      setCurrentImage(image as Image);
      onOpenModal(ModalType.delete);
    },
    [onOpenModal],
  );

  const onDuplicateAction = useCallback(
    (image?: Image) => {
      setCurrentImage(image as Image);
      onOpenModal(ModalType.duplicate);
    },
    [onOpenModal],
  );

  const onOpenInNewTabAction = useCallback(
    (image?: Image) => {
      if (image?.$type) {
        onOpenInNewTab(route, image);
      }
    },
    [route],
  );

  useEffect(() => {
    if (currentImage) {
      getImageVersions(currentImage?.name as string, getImageType(getRouteByType(currentImage.$type))).then(
        ({ response, success, errorHeader, errorMessage }) => {
          if (success) {
            setVersions(response);
          } else {
            showNotification(getErrorNotification(errorHeader, errorMessage));
          }
        },
      );
    }
  }, [currentImage, showNotification]);

  const onDuplicate = useCallback(
    (image: Image) => {
      createImage(image).then((res) => {
        if (res.success) {
          router.push(getUrnForEntity(route, res.response));
          setCurrentImage(null);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [route, router, showNotification],
  );

  const actionColumn = ACTION_COLUMN(
    isReadOnlyAdmin
      ? [getOpenInNewTabOperation(onOpenInNewTabAction)]
      : [
          getOpenInNewTabOperation(onOpenInNewTabAction),
          getDuplicateOperation(onDuplicateAction),
          getDeleteOperation(onDeleteAction),
        ],
  );

  const columnDefs = [...IMAGES_LIST_COLUMNS(t), actionColumn];

  useEffect(() => {
    if (imagesList?.length) {
      imagesList.filter((image) => image.buildStatus === IMAGE_STATUS.BUILDING);
    }
  }, [imagesList, route, showNotification, t]);

  return (
    <>
      <ListEntities
        rowData={imagesList}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        listLabel={t(ImagesI18nKey.ImagesListTitle)}
        emptyDataProps={{ title: t(EntitiesI18nKey.NoImages) }}
        storageKey={`${route}/${DEPLOYMENT_ENTITY.images}`}
        getHref={(data) => getUrnForEntity(route, data)}
        isMainListView
        isEnableColumnPanel
      >
        <HeaderButtons route={route} isReadOnlyAdmin={isReadOnlyAdmin} />
      </ListEntities>
      {isModalOpen &&
        modalType === ModalType.duplicate &&
        currentImage &&
        createPortal(
          <ImageDuplicateModal
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDuplicate}
            image={currentImage}
            names={getUniqueImagesNames(imagesList, currentImage.$type)}
            title={t(ImagesI18nKey.DuplicateModalTitle, {
              type: getTranslatedType(getRouteByType(currentImage.$type), t),
            })}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.delete &&
        currentImage &&
        versions &&
        createPortal(
          <ImageDelete
            onRemoveEntity={deleteImage}
            view={ApplicationRoute.Images}
            entity={{
              ...currentImage,
              name: currentImage.id,
              displayName: currentImage.name,
              versions: versions.map((v) => v.id),
            }}
            onCloseModal={onCloseModal}
            existingVersions={versions}
          />,
          document.body,
        )}
    </>
  );
};

export default ImagesList;
