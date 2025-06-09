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
  onClick: (id: string) => void;
}

const TabContent: FC<Props> = ({ tab, isActive, disabled, invalid, onClick }) => {
  let tabClassNames = classNames(
    'rounded px-3 py-2 flex flex-row gap-2 h-[32px]',
    'cursor-pointer small hover:text-accent-primary',
  );

  if (disabled) {
    tabClassNames = classNames(tabClassNames, 'bg-layer-1 text-secondary pointer-events-none');
  } else if (isActive) {
    tabClassNames = classNames(tabClassNames, 'bg-accent-primary-alpha border-b-2 border-b-accent-primary border-b-2');
  } else {
    tabClassNames = classNames(tabClassNames, 'bg-layer-4 text-primary');
  }

  return (
    <button data-testid="tab" className={tabClassNames} onClick={() => onClick(tab.id)}>
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
