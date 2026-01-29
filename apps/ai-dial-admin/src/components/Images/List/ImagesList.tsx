'use client';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GridOptions, GridApi, CellClickedEvent } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { ApplicationRoute } from '@/src/types/routes';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { Container } from '@/src/models/deployments/containers';
import { createImage, deleteImage, getImageContainers } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import {
  getDeleteOperation,
  getDuplicateOperation,
  getOpenInNewTabOperation,
} from '@/src/constants/grid-columns/actions';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import ListView from '@/src/components/ListView/ListView';
import { EntitiesI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';
import HeaderButtons from '@/src/components/Images/List/HeaderButtons';
import DuplicateImage from '@/src/components/Images/Modals/DuplicateImage';
import Delete from '@/src/components/Deployments/Modals/Delete';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments/deployments';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { IMAGES_LIST_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  route: ApplicationRoute;
  imagesList: Image[];
}

const ImagesList: FC<Props> = ({ route, imagesList }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [modalType, setModalType] = useState<ModalType>();
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [dependencies, setDependencies] = useState<Container[]>([]);

  const [gridApi, setGridApi] = useState<GridApi | null>(null);

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

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const gridOptions: GridOptions = {
    onCellClicked: (e: CellClickedEvent) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(getUrnForEntity(route, e.data));
      }
    },
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
      const fetchDependencies = async () => {
        const { response, success, status } = await getImageContainers(currentImage?.id as string);
        if (!success && status === 403) {
          return;
        }
        setDependencies((response as Container[]) || []);
      };

      fetchDependencies().catch((error) => {
        showNotification(getErrorNotification(error.message));
      });
    }
  }, [currentImage, showNotification]);

  const onDuplicate = useCallback(
    (image: Image) => {
      createImage(image).then((res) => {
        if (res.success) {
          router.refresh();
          setCurrentImage(null);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, showNotification],
  );

  const onDelete = useCallback(() => {
    if (currentImage?.id) {
      deleteImage(currentImage.id).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    }
  }, [currentImage, router, showNotification]);

  const actionColumn = ACTION_COLUMN([
    getOpenInNewTabOperation(onOpenInNewTabAction),
    getDuplicateOperation(onDuplicateAction),
    getDeleteOperation(onDeleteAction),
  ]);

  const columnDefs = [...IMAGES_LIST_COLUMNS(t), actionColumn];

  const toggleColumnsPanel = () => setShowColumnsPanel(!showColumnsPanel);

  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  useEffect(() => {
    if (imagesList?.length) {
      imagesList.filter((image) => image.buildStatus === IMAGE_STATUS.BUILDING);
    }
  }, [imagesList, route, showNotification, t]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  return (
    <>
      <ListView
        data={imagesList}
        view={route}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        title={t(ImagesI18nKey.ImagesListTitle)}
        emptyDataTitle={t(EntitiesI18nKey.NoImages, { type: getTranslatedType(route, t) })}
        showColumnsPanel={showColumnsPanel}
        toggleColumnsPanel={toggleColumnsPanel}
        storageKey={`${route}/${DEPLOYMENT_ENTITY.images}`}
        onGridReady={onGridReady}
      >
        <HeaderButtons toggleColumnsPanel={toggleColumnsPanel} route={route} gridApi={gridApi} />
      </ListView>
      {isModalOpen &&
        modalType === ModalType.duplicate &&
        currentImage &&
        createPortal(
          <DuplicateImage
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDuplicate}
            image={currentImage}
            title={t(ImagesI18nKey.DuplicateModalTitle, { type: getTranslatedType(route, t) })}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.delete &&
        currentImage &&
        createPortal(
          <Delete
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDelete}
            dependencies={dependencies}
            title={t(ImagesI18nKey.DeleteModalTitle, { type: getTranslatedType(route, t) })}
            description={t(ImagesI18nKey.DeleteModalDescription, { type: getTranslatedType(route, t) })}
            route={getRouteByType(currentImage.$type)}
          />,
          document.body,
        )}
    </>
  );
};

export default ImagesList;
