import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import PasswordInput from '@/src/components/Common/PasswordInput/PasswordInput';

const PasswordCellRenderer: FC<ICellRendererParams> = (props: ICellRendererParams) => {
  return (
    <div className="h-6 w-full flex items-center">
      <PasswordInput cssClass="p-0" hideBorder={true} inputId={props.node.id + props.value || ''} value={props.value} />
    </div>
  );
};

export default PasswordCellRenderer;
