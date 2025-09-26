import { FC, ReactNode } from 'react';
import classNames from 'classnames';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { DropdownType } from '@/src/types/dropdown-type';

interface ActionsProps<T> {
  actionTriggerClass?: string;
  items: ActionMenuOperationDeclaration<T>[];
  icon: ReactNode;
  data?: T;
  rowIndex?: number;
}

interface ActionProps<T> {
  item: ActionMenuOperationDeclaration<T>;
  data?: T;
  rowIndex?: number;
}

const ActionsDropdown = <T extends object>({ items, data, rowIndex, ...props }: ActionsProps<T>) => {
  return (
    <div>
      <Dropdown width={200} type={DropdownType.ContextMenu} trigger={<ActionTrigger {...props} />}>
        {items.map((item, i) => (
          <DropdownMenuItem key={i} item={<ActionItem item={item} data={data as T} rowIndex={rowIndex as number} />} />
        ))}
      </Dropdown>
    </div>
  );
};

const ActionTrigger: FC<{ icon: ReactNode; actionTriggerClass?: string }> = ({ icon, actionTriggerClass }) => {
  return <div className={classNames('cursor-pointer', actionTriggerClass)}>{icon}</div>;
};

const ActionItem = <T extends object>({ item, data, rowIndex }: ActionProps<T>) => {
  return (
    <div
      className="text-secondary flex-row flex w-full h-full gap-2 items-center"
      onClick={() => item.onClick(data, rowIndex)}
    >
      {item.icon}
      <span className="text-primary small">{item.id}</span>
    </div>
  );
};

export default ActionsDropdown;
