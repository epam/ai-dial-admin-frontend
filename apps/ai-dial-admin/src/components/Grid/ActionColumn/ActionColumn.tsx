'use client';

import { IconDotsVertical } from '@tabler/icons-react';
import { CustomCellRendererProps } from 'ag-grid-react';

import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';

interface Props<T> extends CustomCellRendererProps<T> {
  items: ActionMenuOperationDeclaration<T>[];
  disabledInsteadHidden?: boolean;
}

const ActionColumn = <T extends object>({ items, data, api, node, disabledInsteadHidden }: Props<T>) => {
  const dropdownItems = disabledInsteadHidden
    ? items.map((item) => {
        return {
          ...item,
          disabled: item.hidden?.(api, node),
        };
      })
    : items
        .filter((item) => !item.hidden?.(api, node))
        .map((item) => ({
          ...item,
          disabled: typeof item.disabled === 'function' ? item.disabled(api, node) : item.disabled,
        }));
  return data ? (
    <div className="size-[24px] ml-[-4px]">
      <ActionsDropdown
        data={data}
        rowIndex={node.rowIndex as number}
        icon={<IconDotsVertical size={16} className="text-secondary" stroke={2} />}
        items={dropdownItems}
        actionTriggerClassName="flex h-[24px] hover:bg-accent-primary-alpha items-center justify-center rounded w-[24px]"
      />
    </div>
  ) : null;
};

export default ActionColumn;
