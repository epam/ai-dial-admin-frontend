import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import Json from '@/public/images/icons/file/json.svg';
import { isJSON } from '@/src/utils/validation/is-valid-json';

const ExtraDataCellRenderer: FC<ICellRendererParams> = (props: ICellRendererParams) => {
  const isJson = isJSON(props.value);
  return (
    <div className="h-6 w-full flex items-center justify-between">
      <div className="truncate mr-2">{props.value}</div>
      {isJson && (
        <div className="flex-1">
          <Json />
        </div>
      )}
    </div>
  );
};

export default ExtraDataCellRenderer;
