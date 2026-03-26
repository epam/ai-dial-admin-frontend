import { FC } from 'react';

import { IconCheck } from '@tabler/icons-react';
import classNames from 'classnames';

export interface TabOption {
  id: string;
  label: string;
}

interface Props {
  tabs: TabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

const TabSelector: FC<Props> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex flex-row items-center bg-layer-4 rounded w-fit p-1">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={classNames(
            'flex flex-row gap-1 h-[24px] items-center py-1 px-2 text-primary cursor-pointer hover:bg-accent-primary-alpha',
            activeTab === tab.id && 'bg-accent-primary-alpha rounded',
          )}
          onClick={() => onChange(tab.id)}
        >
          {activeTab === tab.id && <IconCheck size={16} />}
          <div className="dial-small-text">{tab.label}</div>
        </div>
      ))}
    </div>
  );
};

export default TabSelector;
