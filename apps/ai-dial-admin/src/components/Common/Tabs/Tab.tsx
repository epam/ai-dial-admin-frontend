'use client';

import { FC } from 'react';
import { IconExclamationCircle } from '@tabler/icons-react';
import classNames from 'classnames';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { TabModel } from '@/src/models/tab';

interface Props {
  tab: TabModel;
  isActive: boolean;
  disabled?: boolean;
  invalid?: boolean;
  isHorizontal?: boolean;
  onClick: (id: string) => void;
}

const TabContent: FC<Props> = ({ tab, isActive, disabled, invalid, onClick, isHorizontal }) => {
  let tabClassNames = classNames(
    'rounded px-3 py-2 flex flex-row gap-2 h-[32px]',
    'cursor-pointer small hover:text-accent-primary',
    isHorizontal && 'bg-layer-4',
  );

  if (disabled) {
    tabClassNames = classNames(tabClassNames, 'bg-layer-1 text-secondary pointer-events-none');
  } else if (isActive) {
    tabClassNames = classNames(
      tabClassNames,
      'bg-accent-primary-alpha ',
      isHorizontal ? 'border-b-2 border-b-accent-primary' : 'border-l-2 border-l-accent-primary',
    );
  } else {
    tabClassNames = classNames(tabClassNames, 'text-primary');
  }

  return (
    <button role="tab" className={tabClassNames} onClick={() => onClick(tab.id)}>
      <span>{tab.name}</span>
      {invalid && (
        <div className="text-error">
          <IconExclamationCircle {...BASE_ICON_PROPS} />
        </div>
      )}
    </button>
  );
};

export default TabContent;
