'use client';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Popup from '@/src/components/Common/Popup/Popup';
import Switch from '@/src/components/Common/Switch/Switch';
import {
  getAllAvailableDependencies,
  getButtonTitle,
} from '@/src/components/ExportConfig/AddEntities/AddEntities.utils';
import Grid from '@/src/components/Grid/Grid';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { PopUpState } from '@/src/types/pop-up';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';

interface Props {
  modalState: PopUpState;
  selectedTab?: EntityType;
  entities: EntitiesGridData[];
  columnDefs?: ColDef[];
  onClose: () => void;
  onApply: (entities: EntitiesGridData[], dependencies?: EntityType[]) => void;
}

const AddEntitiesModal: FC<Props> = ({ modalState, selectedTab, entities, columnDefs, onClose, onApply }) => {
  const t = useI18n() as (v: string) => string;
  const [selectedEntities, setSelectedEntities] = useState<EntitiesGridData[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<EntityType[]>([]);
  const [allDependencies, setAllDependencies] = useState<EntityType[]>([]);
  const [includeDependencies, setIncludeDependencies] = useState(false);

  const emptyTitle = useMemo(() => {
    return getEmptyDataTitleI18nKey(selectedTab);
  }, [selectedTab]);

  const modalTitle = useMemo(() => {
    return getButtonTitle(t, selectedTab, true);
  }, [selectedTab, t]);

  const onSelectionChanged = (event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    setSelectedEntities(selectedRows);
  };

  useEffect(() => {
    const dependencies = getAllAvailableDependencies(selectedTab);
    setAllDependencies(dependencies);
    setSelectedDependencies(dependencies);
  }, [selectedTab]);

  const additionalGridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      selectAll: 'all',
    },
    selectionColumnDef: {
      ...CHECKBOX_COL_DEF,
    },
    onSelectionChanged: onSelectionChanged,
  };

  const containerClassName = classNames('h-[800px] lg:max-w-[75%] md:max-w-[90%]');

  const onIncludeDependencies = useCallback(
    (value: boolean) => {
      setIncludeDependencies(value);
      setAllDependencies(getAllAvailableDependencies(selectedTab));
    },
    [selectedTab],
  );

  const onChangeSelectedDependencies = useCallback((value: boolean, key: EntityType) => {
    if (value) {
      setSelectedDependencies((prev) => [...prev, key]);
    } else {
      setSelectedDependencies((prev) => prev.filter((d) => d !== key));
    }
  }, []);

  return (
    <Popup
      onClose={onClose}
      heading={modalTitle}
      portalId="AddExportEntities"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex flex-1 flex-col px-6 py-4 min-h-0">
        {!entities.length ? (
          <NoDataContent emptyDataTitle={t(emptyTitle)} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {!!allDependencies.length && (
              <div className="mb-4">
                <Switch
                  isOn={includeDependencies}
                  title={t(ExportI18nKey.IncludeDependencies)}
                  switchId="includeDependencies"
                  onChange={onIncludeDependencies}
                />
              </div>
            )}
            <div className="flex-1 flex flex-row gap-4 min-h-0">
              {includeDependencies && (
                <div className="flex flex-col gap-4 w-fit rounded border border-primary p-4">
                  {allDependencies.map((dep, i) => {
                    return (
                      <Switch
                        key={i}
                        isOn={selectedDependencies.includes(dep)}
                        title={getButtonTitle(t, dep)}
                        switchId={dep}
                        onChange={(v) => onChangeSelectedDependencies(v, dep)}
                      />
                    );
                  })}
                </div>
              )}
              <div className="flex-1">
                <Grid columnDefs={columnDefs} rowData={entities} additionalGridOptions={additionalGridOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Apply)}
          onClick={() => onApply(selectedEntities, includeDependencies ? selectedDependencies : void 0)}
          disable={!selectedEntities.length}
        />
      </div>
    </Popup>
  );
};

export default AddEntitiesModal;
