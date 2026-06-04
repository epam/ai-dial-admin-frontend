import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { DialDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';

import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { useI18n } from '@/src/locales/client';

interface ActionsProps<T> {
  actionTriggerClassName?: string;
  items: ActionMenuOperationDeclaration<T>[];
  icon: ReactNode;
  data?: T;
  rowIndex?: number;
}

const ActionsDropdown = <T extends object>({ items, data, rowIndex, ...props }: ActionsProps<T>) => {
  const t = useI18n();
  const dropdownItems: DropdownItem[] = items.map((item) => ({
    key: item.id,
    disabled: item.disabled as boolean,
    label: (
      <div className="text-secondary flex-row flex size-full gap-2 items-center">
        {item.icon}
        <span className="text-primary small">{t(item.label)}</span>
      </div>
    ),
    onClick: () => item.onClick(data, rowIndex as number),
  }));

  if (!items.length) {
    return null;
  }

  return (
    <div>
      <DialDropdown items={dropdownItems}>
        <ActionTrigger {...props} />
      </DialDropdown>
    </div>
  );
};

const ActionTrigger: FC<{ icon: ReactNode; actionTriggerClassName?: string }> = ({ icon, actionTriggerClassName }) => {
  return <div className={classNames('cursor-pointer', actionTriggerClassName)}>{icon}</div>;
};

export default ActionsDropdown;
