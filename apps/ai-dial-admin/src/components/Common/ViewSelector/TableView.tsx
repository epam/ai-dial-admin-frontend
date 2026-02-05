import { FC } from 'react';

import { ColDef } from 'ag-grid-community';

import Grid from '@/src/components/Grid/Grid';

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
      <Grid columnDefs={columnDefs} rowData={rowData} />
    </div>
  );
};

export default TableView;
