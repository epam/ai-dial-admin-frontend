import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { useI18n } from '@/src/locales/client';
import { CustomCellRendererProps } from 'ag-grid-react';

interface Props<T> extends CustomCellRendererProps<T> {
  item: ActionMenuOperationDeclaration<T>;
}

const ActionCellRenderer = <T extends object>({ item, data, api, node }: Props<T>) => {
  const t = useI18n();

  if (!data || item.hidden?.(api, node)) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={t(item.label)}
      className="w-full justify-items-center cursor-pointer"
      onClick={() => item.onClick(data, node.rowIndex as number)}
    >
      <span aria-hidden>{item?.icon}</span>
    </button>
  );
};

export default ActionCellRenderer;
