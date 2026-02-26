import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialPasswordInput } from '@epam/ai-dial-ui-kit';

const PasswordCellRenderer: FC<ICellRendererParams> = (props: ICellRendererParams) => {
  return (
    <div className="h-6 w-full flex items-center">
      <DialPasswordInput className="p-0 border-none" id={props.node.id + props.value || ''} value={props.value} />
    </div>
  );
};

export default PasswordCellRenderer;
