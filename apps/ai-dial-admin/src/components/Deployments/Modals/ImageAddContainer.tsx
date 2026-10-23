import {
  NoDataContent,
  Notification,
  NotificationType,
  NotificationVariant,
  Popup,
  PopupSize,
  Spinner,
  Switch,
} from '@epam/ai-dial-ui-kit';

import { GridApi, GridOptions, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getContainers } from '@/src/app/actions/deployments';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { MULTI_ROW_SELECTION } from '@/src/constants/ag-grid';
import { IMAGE_DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteByType, getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getImageType } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';

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
    ...MULTI_ROW_SELECTION,
    onSelectionChanged,
  };

  const columnDefs = [...IMAGE_DEPENDENCIES_COLUMNS(t, true)];

  const onGridReady = ({ api }: GridReadyEvent) => {
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
      const imageDefId = container.source.imageDefinitionId as string;
      if (showRelated) {
        return imageVersionsIds.includes(imageDefId);
      }
      return imageDefId !== image.id;
    });
    setDisplayedDependencies(displayed);
    gridApi?.updateGridOptions({
      rowData: displayed,
    });
  }, [dependencies, gridApi, image.id, imageVersionsIds, showRelated]);

  return (
    <Popup
      onClose={onClose}
      header={title}
      portalId="ImageAddContainerModal"
      open={isModalOpen}
      className="h-[800px]"
      size={PopupSize.Lg}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Apply),
        isSubmitDisabled: !selectedEntities.length,
        onCancel: onClose,
        onSubmit: () => onApply(selectedEntities),
      })}
    >
      <div className="flex flex-col px-6 py-4 min-h-0 h-full">
        {isLoading && <Spinner size={24} fullWidth />}
        {!isLoading && (
          <div className="flex flex-col gap-4 min-h-0 h-full">
            <Switch
              id="related-containers"
              onChange={toggleShowRelated}
              isOn={showRelated}
              labelProps={{ label: t(ContainersI18nKey.ShowRelatedContainers) }}
            />
            {!displayedDependencies.length ? (
              <NoDataContent
                title={t(EntitiesI18nKey.NoContainersType, {
                  type: getTranslatedType(getRouteByType(image.$type), t),
                  entityType: getTranslatedDeploymentType(getRouteByType(image.$type), t),
                })}
              />
            ) : (
              <div className="flex flex-col gap-4 h-full min-h-0">
                <GridView additionalGridOptions={additionalGridOptions} onGridReady={onGridReady} />
                {selectedEntities.some((container) => container.status === CONTAINER_STATUS.RUNNING) && (
                  <Notification
                    type={NotificationType.SectionMessage}
                    message={t(ContainersI18nKey.ContainersRestartWarning)}
                    variant={NotificationVariant.Warning}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Popup>
  );
};

export default ImageAddContainer;
