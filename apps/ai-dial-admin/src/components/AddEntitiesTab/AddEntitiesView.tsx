import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ENTITY_COLUMNS, getAvailableEntities, getEntitiesGridData } from '@/src/components/AddEntitiesTab/utils';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { Toolset } from '@/src/models/dial/toolset';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  viewTitle?: string;
  models?: DialModel[];
  applications?: DialApplication[];
  toolsets?: Toolset[];
  routes?: DialRoute[];
  roles?: DialRole[];
  keys?: DialKey[];
  appRunners?: DialApplicationScheme[];
  customColumns?: ColDef[];
  additionalColumns?: ColDef[];
  customActions?: ActionMenuOperationDeclaration<any>[];
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
  toolsets,
  routes,
  roles,
  keys,
  appRunners,
  viewTitle,
  customColumns,
  additionalColumns,
  customActions,
  modalTitle,
  onAdd,
  onRemove,
  emptyDataTitle,
  isSkipRefresh,
}) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi>();
  const allEntities = getEntitiesGridData(models, applications, roles, keys, appRunners, toolsets, routes);
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
    () => [
      ...columns,
      ...(additionalColumns || []),
      ACTION_COLUMN([getOpenInNewTabOperation(onOpen), ...(customActions || []), getRemoveOperation(onRemoveEntity)]),
    ],
    [additionalColumns, columns, customActions, onOpen, onRemoveEntity],
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
      <div className="size-full flex flex-col">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h1>
            {viewTitle || t(TabsI18nKey.Entities)}: {data.length}
          </h1>
          {onAdd && (
            <DialPrimaryButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              label={t(ButtonsI18nKey.Add)}
              onClick={onOpenModal}
            />
          )}
        </div>
        <GridView
          getIsEmptyData={() => !data?.length}
          onGridReady={onGridReady}
          emptyDataProps={{ title: emptyDataTitle || t(EntitiesI18nKey.NoEntities) }}
        />
      </div>
      {isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={modalTitle || t(EntitiesI18nKey.AddEntities)}
            emptyTitle={emptyDataTitle || t(EntitiesI18nKey.NoEntities)}
            columnDefs={columns}
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
