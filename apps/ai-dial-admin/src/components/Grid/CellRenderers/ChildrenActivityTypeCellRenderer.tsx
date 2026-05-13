import { IconLetterL } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';

interface ChildrenActivityTypeCellRendererParams extends ICellRendererParams {
  /** When false, the child-activity indicator icon is not shown. Defaults to true. */
  showIcon?: boolean;
}

const ChildrenActivityTypeCellRenderer = ({ data, showIcon = true }: ChildrenActivityTypeCellRendererParams) => {
  return (
    <>
      {showIcon && data?.parentActivityId ? <IconLetterL size={14} className="text-secondary m-1" /> : null}
      <span>{data?.activityType}</span>
    </>
  );
};
export default ChildrenActivityTypeCellRenderer;
