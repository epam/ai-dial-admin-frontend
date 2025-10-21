import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ButtonVariant, DialButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import Grid from '@/src/components/Grid/Grid';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { ENTITY_COLUMNS, getAvailableEntities, getEntitiesGridData } from '@/src/components/AddEntitiesTab/utils';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  viewTitle?: string;
  models?: DialModel[];
  applications?: DialApplication[];
  roles?: DialRole[];
  keys?: DialKey[];
  customColumns?: ColDef[];
  modalTitle?: string;
  emptyDataTitle?: string;
  onAdd?: (rows: EntitiesGridData[]) => void;
  onRemove?: (row: EntitiesGridData) => void;
  getRelevantDataForEntity?: (allEntities: EntitiesGridData[]) => EntitiesGridData[];
  isSkipRefresh?: boolean;
}

const AddEntitiesView: FC<Props> = ({
  getRelevantDataForEntity,
  models,
  applications,
  roles,
  keys,
  viewTitle,
  customColumns,
  modalTitle,
  onAdd,
  onRemove,
  emptyDataTitle,
  isSkipRefresh,
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const [gridApi, setGridApi] = useState<GridApi>();
  const allEntities = getEntitiesGridData(models, applications, roles, keys);
  const data = getRelevantDataForEntity ? getRelevantDataForEntity(allEntities) : allEntities;
  const availableEntities = getAvailableEntities(data, allEntities);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onAddEntity = useCallback(
    (rows: EntitiesGridData[]) => {
      onAdd?.(rows);
      onCloseModal();
    },
    [onAdd, onCloseModal],
  );

  const onOpen = useCallback((row?: EntitiesGridData) => {
    onOpenInNewTab(row?.route, row);
  }, []);

  const onRemoveEntity = useCallback(
    (row?: EntitiesGridData) => {
      onRemove?.(row as EntitiesGridData);
    },
    [onRemove],
  );

  const columns: ColDef[] = customColumns || ENTITY_COLUMNS(t);
  const columnDefs = useMemo<ColDef[]>(
    () => [...columns, ACTION_COLUMN([getOpenInNewTabOperation(onOpen), getRemoveOperation(onRemoveEntity)])],
    [columns, onOpen, onRemoveEntity],
  );

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columnDefs,
      rowData: data,
    });
  };

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({
        columnDefs: columnDefs,
        rowData: data,
      });
    }
  }, [isSkipRefresh, columnDefs, data, gridApi]);

  return (
    <>
      <div className="h-full flex flex-col pt-3">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h1>
            {viewTitle || t(TabsI18nKey.Entities)}: {data.length}
          </h1>
          {onAdd && (
            <DialButton
              variant={ButtonVariant.Primary}
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={onOpenModal}
            />
          )}
        </div>
        {!data?.length ? (
          <DialNoDataContent title={emptyDataTitle || t(EntitiesI18nKey.NoEntities)} />
        ) : (
          <Grid additionalGridOptions={{ onGridReady }} />
        )}
      </div>
      {isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={modalTitle || t(EntitiesI18nKey.AddEntities)}
            emptyTitle={emptyDataTitle || t(EntitiesI18nKey.NoEntities)}
            columnDefs={columns.map((c) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { cellRenderer, ...definition } = c;
              return definition;
            })}
            isModalOpen={isModalOpen}
            entities={availableEntities}
            onClose={onCloseModal}
            onApply={onAddEntity}
          />,
          document.body,
        )}
    </>
  );
};

export default AddEntitiesView;
