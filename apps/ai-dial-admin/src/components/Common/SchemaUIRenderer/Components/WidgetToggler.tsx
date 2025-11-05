import { FC, ReactNode, useState } from 'react';

import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props {
  children: ReactNode;
  title?: string;
}
export const WidgetToggler: FC<Props> = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="flex w-full relative">
      {title && (
        <button className="absolute right-0 top-0 p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <IconChevronUp size="24" /> : <IconChevronDown size="24" />}
        </button>
      )}
      <div className={classNames('w-full', !isOpen && 'hidden')}>{children}</div>
      <div className={classNames('w-full h-10 pl-[18px] flex items-center bg-layer-2', isOpen && 'hidden')}>
        {title}
      </div>
    </div>
  );
};
