import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '@/src/components/Common/Button/Button';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import Grid from '@/src/components/Grid/Grid';
import { ACTION_COLUMN, ACTION_COLUMN_COMPONENTS } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialAddon } from '@/src/models/dial/addon';
import { DialApplication } from '@/src/models/dial/application';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { PopUpState } from '@/src/types/pop-up';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/utils/entities/entity-operations';
import {
  ENTITY_COLUMNS,
  getAvailableEntities,
  getEntitiesGridData,
} from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';
import { EntitiesGridData } from '@/src/models/entities-grid-data';

interface Props {
  viewTitle?: string;
  models?: DialModel[];
  applications?: DialApplication[];
  addons?: DialAddon[];
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
  addons,
  applications,
  roles,
  keys,
  viewTitle,
  customColumns,
  modalTitle: modalTitle,
  onAdd,
  onRemove,
  emptyDataTitle,
  isSkipRefresh,
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const [gridApi, setGridApi] = useState<GridApi>();
  const allEntities = getEntitiesGridData(models, applications, addons, roles, keys);
  const data = getRelevantDataForEntity ? getRelevantDataForEntity(allEntities) : allEntities;
  const availableEntities = getAvailableEntities(data, allEntities);

  const [modalState, setModalState] = useState(PopUpState.Closed);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const onAddEntity = useCallback(
    (rows: EntitiesGridData[]) => {
      onAdd?.(rows);
      onCloseModal();
    },
    [onAdd, onCloseModal],
  );

  const onOpenInNewTab = useCallback((row: EntitiesGridData) => {
    window.open(`${row.route}/${row.name || row.key}`, '_blank');
  }, []);

  const onRemoveEntity = useCallback(
    (row: EntitiesGridData) => {
      onRemove?.(row);
    },
    [onRemove],
  );

  const columns: ColDef[] = customColumns || ENTITY_COLUMNS(t);
  const columnDefs = useMemo<ColDef[]>(
    () => [...columns, ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTab), getRemoveOperation(onRemoveEntity)])],
    [columns, onOpenInNewTab, onRemoveEntity],
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
            <Button
              cssClass="primary"
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={onOpenModal}
            />
          )}
        </div>
        {!data?.length ? (
          <NoDataContent emptyDataTitle={emptyDataTitle || t(EntitiesI18nKey.NoEntities)} />
        ) : (
          <Grid additionalGridOptions={{ ...ACTION_COLUMN_COMPONENTS, onGridReady }} />
        )}
      </div>
      {modalState === PopUpState.Opened &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={modalTitle || t(EntitiesI18nKey.AddEntities)}
            emptyTitle={emptyDataTitle || t(EntitiesI18nKey.NoEntities)}
            columnDefs={columns.map((c) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { cellRenderer, ...definition } = c;
              return definition;
            })}
            modalState={modalState}
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
