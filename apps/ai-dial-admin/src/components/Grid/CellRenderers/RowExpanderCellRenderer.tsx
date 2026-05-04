import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';
interface RowExpanderCellRendererParams extends ICellRendererParams {
  canToggleExpand?: boolean;
  isExpanded: boolean;
  onToggleExpand?: (value: boolean) => void;
}

const RowExpanderCellRenderer = ({
  data,
  canToggleExpand,
  isExpanded,
  onToggleExpand,
}: RowExpanderCellRendererParams) => {
  const hasChildren = data?.children && data.children.length > 0;

  if (!hasChildren) return null;

  return (
    <div
      className={classNames(
        'flex items-center justify-center size-[18px] shrink-0 rounded',
        canToggleExpand && 'cursor-pointer hover:bg-layer-3',
      )}
      onClick={() => canToggleExpand && onToggleExpand?.(!isExpanded)}
    >
      {isExpanded ? (
        <IconChevronDown size={14} className="text-secondary" />
      ) : (
        <IconChevronRight size={14} className="text-secondary" />
      )}
    </div>
  );
};
export default RowExpanderCellRenderer;
