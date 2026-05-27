import { NotificationVariant, DialNotification, DialFormPopup, DialLoader } from '@epam/ai-dial-ui-kit';
import { GridOptions, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getImagesWithVersions } from '@/src/app/actions/deployments';
import { ACTION_COLUMN, SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { IMAGES_LIST_FOR_CONTAINER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Image, ImageGroup } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { getTranslatedDeploymentType } from '@/src/utils/deployments/entity';
import { getImageType, isValidVersion, updateSelectedVersion } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

import GridView from '@/src/components/Grid/GridView/GridView';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onApply: (id: string) => void;
  route: ApplicationRoute;
  image: Image;
  containerStatus?: CONTAINER_STATUS;
}

const ContainerChangeImage: FC<Props> = ({
  onClose,
  isModalOpen,
  modalTitle,
  route,
  onApply,
  image,
  containerStatus,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [id, setId] = useState(image.id);
  const [images, setImages] = useState<ImageGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const onOpenInNewTabAction = useCallback((image?: ImageGroup) => {
    onOpenInNewTab(ApplicationRoute.Images, { id: image?.selectedId });
  }, []);

  const onVersionsChange = useCallback(
    (id: string) => {
      setImages(updateSelectedVersion(images, id));
      setId(id);
    },
    [images],
  );

  const colDefs = useMemo(
    () => [
      ...IMAGES_LIST_FOR_CONTAINER_COLUMNS(onVersionsChange),
      ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction)]),
    ],
    [onOpenInNewTabAction, onVersionsChange],
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getImagesWithVersions(getImageType(route));
      if (res.success) {
        setLoading(false);
        setImages(
          updateSelectedVersion(
            (res.response as ImageGroup[]).filter((group) =>
              group.availableVersions.some((v) => v.status === IMAGE_STATUS.BUILT),
            ),
            image.id,
          ),
        );
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    };

    fetchData().catch((err) => console.error(err));
  }, [showNotification, setLoading, route, image.name, image.id]);

  useEffect(() => {
    if (images.length) {
      const found = images?.find((i) => i.selectedId === id);
      setIsValid(isValidVersion(found) && id !== image.id);
    }
  }, [id, image.id, images]);

  const additionalGridOptions: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: { selectedId: string; name: string }; name: string }) => (
        <RadioButtonRenderer inputId={data.data?.name || data.name} isChecked={data.data?.selectedId === id} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setId(event.data?.selectedId);
      }
    },
  };

  const onGridReady = (event: GridReadyEvent) => {
    event.api?.updateGridOptions({
      rowData: images,
      columnDefs: colDefs,
    });
    event.api.forEachNode((node) => {
      if (node.data?.selectedId === id && isValidVersion(node.data as ImageGroup)) {
        node.setSelected(true);
        event.api.ensureNodeVisible(node, 'middle');
      }
    });
  };

  return (
    <DialFormPopup
      onClose={onClose}
      header={modalTitle}
      portalId="ContainerChangeImageModal"
      open={isModalOpen}
      className="lg:max-w-[55%] md:max-w-[75%] h-[600px]"
      disableSubmitButton={!isValid}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={() => {
        onApply(id);
        onClose();
      }}
    >
      <div className="flex flex-col py-4 px-6 min-h-0 h-full">
        {loading && <DialLoader size={24} />}
        {!loading && !!images.length && (
          <div className="flex flex-col gap-4 min-h-0 h-full">
            <GridView
              rowData={images}
              columnDefs={colDefs}
              additionalGridOptions={additionalGridOptions}
              onGridReady={onGridReady}
            />
            {containerStatus === CONTAINER_STATUS.RUNNING && (
              <DialNotification
                message={t(ContainersI18nKey.ContainerRestartWarning, {
                  entityType: getTranslatedDeploymentType(route, t),
                })}
                variant={NotificationVariant.Warning}
              />
            )}
          </div>
        )}
      </div>
    </DialFormPopup>
  );
};

export default ContainerChangeImage;
