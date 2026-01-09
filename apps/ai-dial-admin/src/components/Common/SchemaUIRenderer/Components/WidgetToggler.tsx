import { FC, ReactNode, useState } from 'react';

import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props {
  children: ReactNode;
  title?: string;
  isRoot?: boolean;
}
export const WidgetToggler: FC<Props> = ({ children, title, isRoot }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex w-full relative">
      {!isRoot && (
        <button className="absolute right-0 top-0 p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <IconChevronUp size="24" stroke={2} /> : <IconChevronDown size="24" stroke={2} />}
        </button>
      )}
      <div className={classNames('w-full', !isOpen && !isRoot && 'hidden')}>{children}</div>
      <div className={classNames('w-full h-10 pl-[18px] flex items-center bg-layer-2', (isOpen || isRoot) && 'hidden')}>
        {title}
      </div>
    </div>
  );
};
