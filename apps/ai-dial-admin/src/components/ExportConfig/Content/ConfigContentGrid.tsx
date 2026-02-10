'use client';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import { getDataWithoutItem } from '@/src/components/ExportConfig/Content/utils';
import { getActualColDefs, getFilteredData } from '@/src/components/ExportConfig/utils';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import GridView from '../../Grid/GridView/GridView';

interface Props {
  selectedTab: EntityType;
  tabData: Record<string, EntitiesGridData[]>;
  isFull: boolean;
  customExportData?: Record<string, EntitiesGridData[]>;
  setCustomExportData?: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
  selectedTopics?: string[];
  onChangeItemsCount?: (count: number) => void;
}

const ConfigContentGrid: FC<Props> = ({
  selectedTab,
  tabData,
  isFull,
  customExportData,
  setCustomExportData,
  selectedTopics,
  onChangeItemsCount,
}) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi>();

  const [fullData, setFullData] = useState<EntitiesGridData[]>([]);
  const [customData, setCustomData] = useState<EntitiesGridData[]>([]);
  const [fullColDefs, setFullColDefs] = useState<ColDef[]>([]);
  const [customColDefs, setCustomColDefs] = useState<ColDef[]>([]);

  const customExportDataRef = useRef(customExportData?.[selectedTab]);

  useEffect(() => {
    customExportDataRef.current = customExportData?.[selectedTab];
  }, [customExportData, selectedTab]);

  const emptyDataTitleI18nkKey = useMemo(() => {
    return getEmptyDataTitleI18nKey(selectedTab);
  }, [selectedTab]);

  const onRemove = useCallback(
    (entity?: EntitiesGridData) => {
      if (customExportDataRef.current && setCustomExportData) {
        const newData = getDataWithoutItem(customExportDataRef.current, entity, selectedTab);
        setCustomExportData((prev) => {
          return {
            ...prev,
            [selectedTab]: newData,
          };
        });
      }
    },
    [selectedTab, setCustomExportData],
  );

  useEffect(() => {
    if (selectedTab) {
      const columnDefs = isFull ? getActualColDefs(selectedTab, t) : getActualColDefs(selectedTab, t, onRemove);
      const rowData = isFull
        ? getFilteredData(tabData, selectedTab, selectedTopics)
        : getFilteredData(customExportData, selectedTab, selectedTopics);
      onChangeItemsCount?.(rowData.length || 0);
      if (isFull) {
        setFullColDefs(columnDefs);
        setFullData(rowData);
      } else {
        setCustomColDefs(columnDefs);
        setCustomData(rowData);
      }
      gridApi?.setFilterModel(null);
      gridApi?.refreshHeader();
      gridApi?.updateGridOptions({
        rowData,
        columnDefs,
      });
    } else {
      setFullColDefs([]);
      setFullData([]);
      setCustomColDefs([]);
      setCustomData([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, isFull, customExportData, selectedTopics]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);

    event.api?.updateGridOptions({
      columnDefs: isFull ? fullColDefs : customColDefs,
      rowData: isFull ? fullData : customData,
    });
  };

  return (isFull ? fullData.length === 0 : customData.length === 0) ? (
    <DialNoDataContent title={t(emptyDataTitleI18nkKey)} />
  ) : (
    <GridView emptyDataTitle={t(emptyDataTitleI18nkKey)} onGridReady={onGridReady} />
  );
};

export default ConfigContentGrid;
