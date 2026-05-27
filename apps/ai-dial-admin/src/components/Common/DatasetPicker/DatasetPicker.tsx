'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialFormPopup, DialInput, DialLoader, PopupSize } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions } from 'ag-grid-community';

import { getDatasets } from '@/src/app/[lang]/datasets/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, DatasetsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { FilterOperatorDto } from '@/src/types/request';

const PAGE_SIZE = 100;

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onSelect: (dataset: Dataset) => void;
}

const DatasetPicker: FC<Props> = ({ isModalOpen, onClose, onSelect }) => {
  const t = useI18n();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selected, setSelected] = useState<Dataset | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    setIsLoading(true);
    const filters = search ? [{ column: 'name', operator: FilterOperatorDto.CONTAINS, value: search }] : [];
    getDatasets(0, PAGE_SIZE, [], filters)
      .then((res) => {
        setDatasets(res?.content ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [isModalOpen, search]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'name', headerName: 'Name', flex: 2 },
      { field: 'description', headerName: 'Description', flex: 3 },
      { field: 'createdBy', headerName: 'Created by', flex: 1 },
    ],
    [],
  );

  const gridOptions: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    rowSelection: { mode: 'singleRow', enableClickSelection: true },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setSelected(event.data as Dataset);
      }
    },
  };

  const onSubmit = useCallback(() => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  }, [selected, onSelect, onClose]);

  return (
    <DialFormPopup
      open={isModalOpen}
      header={t(DatasetsI18nKey.PickPublic)}
      portalId="DatasetPicker"
      size={PopupSize.Lg}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onClose={onClose}
      onCancel={onClose}
      onSubmit={onSubmit}
      disableSubmitButton={!selected}
      className="h-[600px]"
    >
      <div className="flex flex-col gap-4 px-6 py-4 flex-1 min-h-0">
        <DialInput
          id="dataset-search"
          placeholder="Search by name"
          value={search}
          onChange={(v) => setSearch(v ?? '')}
        />
        {isLoading ? (
          <DialLoader size={40} />
        ) : (
          <div className="flex-1 min-h-0">
            <GridView columnDefs={columnDefs} rowData={datasets} additionalGridOptions={gridOptions} />
          </div>
        )}
      </div>
    </DialFormPopup>
  );
};

export default DatasetPicker;
