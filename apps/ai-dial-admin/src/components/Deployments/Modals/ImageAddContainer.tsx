import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertVariant,
  DialAlert,
  DialFormPopup,
  DialLoader,
  DialNoDataContent,
  DialSwitch,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { GridApi, GridOptions, SelectionChangedEvent } from 'ag-grid-community';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { getContainers } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { getRouteByType, getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { getImageType } from '@/src/utils/deployments/images';
import { useI18n } from '@/src/locales/client';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';

import Grid from '@/src/components/Grid/Grid';

interface Props {
  title: string;
  isModalOpen: boolean;
  image: Image;
  onClose: () => void;
  onApply: (entities: Container[]) => void;
  route: ApplicationRoute;
  versions: ImageVersion[];
}

const ImageAddContainer: FC<Props> = ({ title, isModalOpen, onClose, onApply, image, route, versions }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [showRelated, setShowRelated] = useState(true);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [dependencies, setDependencies] = useState<Container[]>([]);
  const [displayedDependencies, setDisplayedDependencies] = useState<Container[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<Container[]>([]);

  const imageVersionsIds = useMemo(
    () => versions.map((image) => image.id).filter((id) => id !== image.id),
    [image.id, versions],
  );

  const toggleShowRelated = useCallback(() => {
    setShowRelated((prev) => !prev);
  }, []);

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

  const columnDefs = [...IMAGE_DEPENDENCIES_COLUMNS(t, true)];

  const onGridReady = (api: GridApi) => {
    api?.updateGridOptions({
      columnDefs,
      rowData: displayedDependencies,
    });
    setGridApi(api);
  };

  useEffect(() => {
    setIsLoading(true);
    getContainers(getImageType(getRouteByType(image.$type))).then(
      ({ success, response, requestId, errorMessage, errorHeader }) => {
        if (success) {
          setDependencies((response as Container[]) || []);
        } else {
          showNotification(getErrorNotification(errorHeader, errorMessage, requestId, 5000));
        }
        setIsLoading(false);
      },
    );
  }, [image, route, showNotification]);

  useEffect(() => {
    const displayed = dependencies.filter((container) => {
      if (showRelated) {
        return imageVersionsIds.includes(container.imageDefinitionId);
      }
      return container.imageDefinitionId !== image.id;
    });
    setDisplayedDependencies(displayed);
    gridApi?.updateGridOptions({
      rowData: displayed,
    });
  }, [dependencies, gridApi, image.id, imageVersionsIds, showRelated]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={title}
      portalId="ImageAddContainerModal"
      open={isModalOpen}
      className="h-[800px]"
      size={PopupSize.Lg}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={() => onApply(selectedEntities)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableSubmitButton={!selectedEntities.length}
      onCancel={onClose}
    >
      <div className="flex flex-col px-6 py-4 min-h-0 h-full">
        {isLoading && <DialLoader size={24} />}
        {!isLoading && (
          <div className="flex flex-col gap-4  min-h-0 h-full">
            <DialSwitch
              switchId={'related-containers'}
              onChange={toggleShowRelated}
              isOn={showRelated}
              label={t(ContainersI18nKey.ShowRelatedContainers)}
            />
            {!displayedDependencies.length ? (
              <DialNoDataContent
                title={t(EntitiesI18nKey.NoContainersType, {
                  type: getTranslatedType(getRouteByType(image.$type), t),
                  entityType: getTranslatedDeploymentType(getRouteByType(image.$type), t),
                })}
              />
            ) : (
              <div className="flex flex-col gap-4 h-full min-h-0">
                <Grid additionalGridOptions={additionalGridOptions} onGridReady={onGridReady} />
                {selectedEntities.some((container) => container.status === CONTAINER_STATUS.RUNNING) && (
                  <DialAlert
                    message={t(ContainersI18nKey.ContainersRestartWarning, {
                      entityType: getTranslatedDeploymentType(route, t),
                    })}
                    variant={AlertVariant.Warning}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DialFormPopup>
  );
};

export default ImageAddContainer;
