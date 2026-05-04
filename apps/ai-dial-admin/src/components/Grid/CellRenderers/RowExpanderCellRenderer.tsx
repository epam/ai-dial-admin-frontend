import { IconChevronDown } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';

const RowExpanderCellRenderer = ({ data }: ICellRendererParams) => {
  const hasChildren = data?.children && data.children.length > 0;

  if (!hasChildren) return null;

  return (
    <div className={'flex items-center justify-center size-[18px] shrink-0 rounded'}>
      <IconChevronDown size={14} className="text-secondary" />
    </div>
  );
};
export default RowExpanderCellRenderer;
