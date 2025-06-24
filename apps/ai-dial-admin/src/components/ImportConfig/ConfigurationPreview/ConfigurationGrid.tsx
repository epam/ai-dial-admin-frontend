'use client';
import { FC, useEffect, useMemo, useState } from 'react';
import { ColDef } from 'ag-grid-community';

import { useI18n } from '@/src/locales/client';
import Grid from '@/src/components/Grid/Grid';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import { getComponentColDefs } from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialAdapter } from '@/src/models/dial/adapter';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';

interface Props {
  selectedTab: EntityType;
  tabData: Record<string, DialBaseEntity[]>;
  adapters: DialAdapter[];
}

const ConfigurationGrid: FC<Props> = ({ selectedTab, tabData, adapters }) => {
  const t = useI18n() as (v: string) => string;

  const [rowData, setRowData] = useState<DialBaseEntity[]>([]);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);

  const emptyDataTitleI18nkKey = useMemo(() => {
    return getEmptyDataTitleI18nKey(selectedTab);
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab) {
      setColDefs(getComponentColDefs(selectedTab, adapters, t));
      setRowData(tabData[selectedTab] || []);
    } else {
      setColDefs([]);
      setRowData([]);
    }
  }, [adapters, selectedTab, t, tabData]);

  return rowData.length === 0 ? (
    <NoDataContent emptyDataTitle={t(emptyDataTitleI18nkKey)} />
  ) : (
    <Grid columnDefs={colDefs} rowData={rowData} />
  );
};

export default ConfigurationGrid;
