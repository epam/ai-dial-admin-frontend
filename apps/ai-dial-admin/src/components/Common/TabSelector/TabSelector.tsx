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
  clearView?: boolean;
}

const TabSelector: FC<Props> = ({ tabs, activeTab, onChange, clearView }) => {
  return (
    <div
      className={classNames(
        'flex flex-row items-center bg-layer-4 rounded-[4px] w-fit',
        clearView ? 'border border-primary' : 'gap-2 p-1',
      )}
    >
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={classNames(
            'flex flex-row gap-1 h-[24px] items-center  cursor-pointer py-1 hover:bg-accent-primary-alpha',
            activeTab === tab.id ? 'bg-accent-primary-alpha !text-primary' : 'text-secondary',
            clearView ? 'px-3' : 'px-2 rounded',
            {
              'rounded-l-[4px]': clearView && index === 0,
              'rounded-r-[4px]': clearView && index === tabs.length - 1,
            },
          )}
          onClick={() => onChange(tab.id)}
        >
          {activeTab === tab.id && !clearView && <IconCheck size={16} />}
          <div className="dial-small-text">{tab.label}</div>
        </div>
      ))}
    </div>
  );
};

export default TabSelector;
