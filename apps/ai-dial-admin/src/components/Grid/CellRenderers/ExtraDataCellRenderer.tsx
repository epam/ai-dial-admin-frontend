import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialItemType, FileIcon } from '@epam/ai-dial-ui-kit';

import { isJSON } from '@/src/utils/validation/is-valid-json';

const ExtraDataCellRenderer: FC<ICellRendererParams> = (props: ICellRendererParams) => {
  const isJson = isJSON(props.value);
  return (
    <div className="h-6 w-full flex items-center justify-between">
      <div className="truncate mr-2">{props.value}</div>
      {isJson && <FileIcon type={DialItemType.File} name="file.json" decorative className="text-secondary" />}
    </div>
  );
};

export default ExtraDataCellRenderer;
