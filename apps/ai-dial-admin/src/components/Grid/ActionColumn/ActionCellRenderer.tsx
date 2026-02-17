import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { CustomCellRendererProps } from 'ag-grid-react';

interface Props<T> extends CustomCellRendererProps<T> {
  item: ActionMenuOperationDeclaration<T>;
}

const ActionCellRenderer = <T extends object>({ item, data, node }: Props<T>) => {
  return data ? (
    <div
      className="w-full justify-items-center cursor-pointer"
      onClick={() => item.onClick(data, node.rowIndex as number)}
    >
      {item?.icon}
    </div>
  ) : null;
};

export default ActionCellRenderer;
