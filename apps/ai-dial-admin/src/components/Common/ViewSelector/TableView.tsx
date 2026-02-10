import { FC } from 'react';

import { ColDef } from 'ag-grid-community';

import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import GridView from '@/src/components/Grid/GridView/GridView';

interface Props {
  title: string;
  columnDefs: ColDef[];
  rowData: object[];
}

const TableView: FC<Props> = ({ title, columnDefs, rowData }) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between mb-2">
        <p className="small text-secondary">{title}</p>
      </div>
      <GridView emptyDataTitle={t(EntitiesI18nKey.NoDependencies)} columnDefs={columnDefs} rowData={rowData} />
      <AgGridWrapper columnDefs={columnDefs} rowData={rowData} />
    </div>
  );
};

export default TableView;
