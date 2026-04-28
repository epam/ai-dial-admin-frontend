import { IconLetterL } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';

const ChildrenActivityTypeCellRenderer = ({ data }: ICellRendererParams) => {
  return (
    <>
      {data?.parentActivityId ? <IconLetterL size={14} className="text-secondary m-1" /> : null}
      <span>{data?.activityType}</span>
    </>
  );
};
export default ChildrenActivityTypeCellRenderer;
