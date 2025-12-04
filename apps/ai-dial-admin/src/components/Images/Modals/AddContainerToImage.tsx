import { FC, useEffect, useMemo, useState } from 'react';
import { AlertVariant, DialAlert, DialFormPopup, DialNoDataContent, PopupSize } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { ImageVersion } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { GridApi, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { getContainers } from '@/src/app/actions/deployments';
import { getImageType } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import Grid from '@/src/components/Grid/Grid';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';

interface Props {
  title: string;
  isModalOpen: boolean;
  imageId: string;
  onClose: () => void;
  onApply: (entities: Container[]) => void;
  route: ApplicationRoute;
  versions: ImageVersion[];
}

const AddContainerToImage: FC<Props> = ({ title, isModalOpen, onClose, onApply, imageId, route, versions }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [dependencies, setDependencies] = useState<Container[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<Container[]>([]);
  const imageVersionsIds = useMemo(
    () => versions.map((image) => image.id).filter((id) => id !== imageId),
    [imageId, versions],
  );

  const onSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedEntities(selectedRows);
  };

  const additionalGridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      headerCheckbox: true,
      selectAll: 'filtered',
    },
    selectionColumnDef: {
      ...CHECKBOX_COL_DEF,
    },
    onSelectionChanged: onSelectionChanged,
  };

  const columnDefs = [...IMAGE_DEPENDENCIES_COLUMNS(t)];

  useEffect(() => {
    getContainers(getImageType(route)).then(({ success, response, requestId, errorMessage, errorHeader }) => {
      if (success) {
        setDependencies(
          (response as Container[]).filter((container) => imageVersionsIds.includes(container.imageDefinitionId)) || [],
        );
      } else {
        showNotification(getErrorNotification(errorHeader, errorMessage, requestId, 5000));
      }
    });
  }, [imageVersionsIds, route, showNotification]);

  const onGridReady = (api: GridApi) => {
    api?.updateGridOptions({
      columnDefs,
      rowData: dependencies,
    });
  };

  return (
    <DialFormPopup
      onClose={onClose}
      title={title}
      portalId="AddEntity"
      open={isModalOpen}
      className="h-[800px]"
      size={PopupSize.Lg}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={() => onApply(selectedEntities)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableSubmitButton={!selectedEntities.length}
      onCancel={onClose}
    >
      <div className="flex h-full flex-col px-6 py-4 min-h-0">
        {!dependencies.length ? (
          <DialNoDataContent title={t(EntitiesI18nKey.NoContainersType, { type: getTranslatedType(route, t) })} />
        ) : (
          <div className="flex flex-col gap-4 h-full min-h-0  ">
            <Grid additionalGridOptions={additionalGridOptions} onGridReady={onGridReady} />
            {selectedEntities.some((conainer) => conainer.status === CONTAINER_STATUS.RUNNING) && (
              <DialAlert message={t(ContainersI18nKey.ContainersRestartWarning)} variant={AlertVariant.Warning} />
            )}
          </div>
        )}
      </div>
    </DialFormPopup>
  );
};

export default AddContainerToImage;
