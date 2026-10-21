import { FC, ReactNode, useState } from 'react';
import classNames from 'classnames';
import { DialDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';

import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { ButtonsI18nKey } from '@/src/constants/i18n';
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
  const [isOpen, setIsOpen] = useState(false);
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
      <DialDropdown items={dropdownItems} open={isOpen} onOpenChange={setIsOpen}>
        <ActionTrigger {...props} isOpen={isOpen} />
      </DialDropdown>
    </div>
  );
};

interface TriggerProps {
  icon: ReactNode;
  actionTriggerClassName?: string;
  isOpen: boolean;
}

const ActionTrigger: FC<TriggerProps> = ({ icon, actionTriggerClassName, isOpen }) => {
  const t = useI18n();

  return (
    <button
      type="button"
      aria-label={t(ButtonsI18nKey.Actions)}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className={classNames('cursor-pointer', actionTriggerClassName)}
    >
      <span aria-hidden>{icon}</span>
    </button>
  );
};

export default ActionsDropdown;
