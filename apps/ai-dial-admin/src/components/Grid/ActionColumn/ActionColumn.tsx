'use client';

import { CustomCellRendererProps } from 'ag-grid-react';
import { FC } from 'react';
import { IconDots } from '@tabler/icons-react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { DropdownType } from '@/src/types/dropdown-type';
import { EntityOperationDeclaration } from '@/src/models/entity-operations';
import ActionItem from './ActionItem';

interface Props<T> extends CustomCellRendererProps<T> {
  items: EntityOperationDeclaration<T>[];
}

const ActionColumn = <T extends object>({ items, data, api, node }: Props<T>) => {
  const dropdownItems = items.filter((item) => !item.hidden?.(api, node));
  return data ? (
    <div className="w-[24px] h-[24px] ml-[-4px]">
      <Dropdown width={200} type={DropdownType.ContextMenu} trigger={<ActionTrigger />}>
        {dropdownItems.map((item, i) => (
          <DropdownMenuItem key={i} item={<ActionItem item={item} entity={data as T} />} />
        ))}
      </Dropdown>
    </div>
  ) : null;
};

const ActionTrigger: FC = () => {
  return (
    <div className="cursor-pointer flex h-[24px] hover:bg-accent-primary-alpha items-center justify-center rounded w-[24px]">
      <IconDots width={16} height={16} stroke={2} />
    </div>
  );
};

export default ActionColumn;
