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
}

interface ActionProps<T> {
  item: ActionMenuOperationDeclaration<T>;
}

const ActionsDropdown = <T extends object>({ items, ...props }: ActionsProps<T>) => {
  return (
    <div>
      <Dropdown width={200} type={DropdownType.ContextMenu} trigger={<ActionTrigger {...props} />}>
        {items.map((item, i) => (
          <DropdownMenuItem key={i} item={<ActionItem item={item} />} />
        ))}
      </Dropdown>
    </div>
  );
};

const ActionTrigger: FC<{ icon: ReactNode; actionTriggerClass?: string }> = ({ icon, actionTriggerClass }) => {
  return <div className={classNames('cursor-pointer', actionTriggerClass)}>{icon}</div>;
};

const ActionItem = <T extends object>({ item }: ActionProps<T>) => {
  return (
    <div className="text-primary flex-row flex w-full gap-2 items-center" onClick={() => item.onClick()}>
      <span className="text-secondary">{item.icon}</span>
      <span className="small-medium">{item.id}</span>
    </div>
  );
};

export default ActionsDropdown;
