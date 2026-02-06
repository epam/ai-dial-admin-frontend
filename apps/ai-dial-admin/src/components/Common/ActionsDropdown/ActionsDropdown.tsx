import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { DialDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';

import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';

interface ActionsProps<T> {
  actionTriggerClassName?: string;
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
  const dropdownItems: DropdownItem[] = items.map((item) => ({
    key: item.id,
    disabled: item.disabled,
    label: <ActionItem item={item} data={data as T} rowIndex={rowIndex as number} />,
  }));

  if (!items.length) {
    return null;
  }

  return (
    <div>
      <DialDropdown menu={{ items: dropdownItems }}>
        <ActionTrigger {...props} />
      </DialDropdown>
    </div>
  );
};

const ActionTrigger: FC<{ icon: ReactNode; actionTriggerClassName?: string }> = ({ icon, actionTriggerClassName }) => {
  return <div className={classNames('cursor-pointer', actionTriggerClassName)}>{icon}</div>;
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
