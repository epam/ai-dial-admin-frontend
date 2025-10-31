import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialFileIcon } from '@epam/ai-dial-ui-kit';

import { isJSON } from '@/src/utils/validation/is-valid-json';

const ExtraDataCellRenderer: FC<ICellRendererParams> = (props: ICellRendererParams) => {
  const isJson = isJSON(props.value);
  return (
    <div className="h-6 w-full flex items-center justify-between">
      <div className="truncate mr-2">{props.value}</div>
      {isJson && <DialFileIcon extension="json" cssClass="text-secondary" />}
    </div>
  );
};

export default ExtraDataCellRenderer;
