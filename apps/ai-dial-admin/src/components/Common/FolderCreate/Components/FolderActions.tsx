import { FC, ReactNode } from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { FolderOperationDeclaration } from '@/src/components/Common/FolderCreate/models';
import { DropdownType } from '@/src/types/dropdown-type';

interface ActionsProps {
  items: FolderOperationDeclaration[];
  icon: ReactNode;
}

interface ActionProps {
  item: FolderOperationDeclaration;
}

const FolderActions: FC<ActionsProps> = ({ items, icon }) => {
  return (
    <div>
      <Dropdown width={200} type={DropdownType.ContextMenu} trigger={<ActionTrigger icon={icon} />}>
        {items.map((item, i) => (
          <DropdownMenuItem key={i} item={<ActionItem item={item} />} />
        ))}
      </Dropdown>
    </div>
  );
};

const ActionTrigger: FC<{ icon: ReactNode }> = ({ icon }) => {
  return <div className="cursor-pointer">{icon}</div>;
};

const ActionItem: FC<ActionProps> = ({ item }) => {
  return (
    <div className="text-primary flex-row flex w-full gap-2 items-center" onClick={item.onClick}>
      <span className="text-secondary">{item.icon}</span>
      <span className="small-medium">{item.id}</span>
    </div>
  );
};

export default FolderActions;
