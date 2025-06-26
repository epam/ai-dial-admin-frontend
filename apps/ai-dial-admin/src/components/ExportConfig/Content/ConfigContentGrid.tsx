'use client';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import { getDataWithoutItem } from '@/src/components/ExportConfig/Content/ConfigContent.utils';
import { getActualColDefs } from '@/src/components/ExportConfig/ExportConfig.utils';
import Grid from '@/src/components/Grid/Grid';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';

interface Props {
  selectedTab: EntityType;
  tabData: Record<string, EntitiesGridData[]>;
  isFull: boolean;
  customExportData?: Record<string, EntitiesGridData[]>;
  setCustomExportData?: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
}

const ConfigContentGrid: FC<Props> = ({ selectedTab, tabData, isFull, customExportData, setCustomExportData }) => {
  const t = useI18n() as (v: string) => string;

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
    (entity: EntitiesGridData) => {
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
      const rowData = isFull ? tabData[selectedTab] || [] : customExportData?.[selectedTab] || [];

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
  }, [selectedTab, isFull, customExportData]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);

    event.api?.updateGridOptions({
      columnDefs: isFull ? fullColDefs : customColDefs,
      rowData: isFull ? fullData : customData,
    });
  };

  return (isFull ? fullData.length === 0 : customData.length === 0) ? (
    <NoDataContent emptyDataTitle={t(emptyDataTitleI18nkKey)} />
  ) : (
    <Grid
      additionalGridOptions={{
        onGridReady,
      }}
    />
  );
};

export default ConfigContentGrid;
