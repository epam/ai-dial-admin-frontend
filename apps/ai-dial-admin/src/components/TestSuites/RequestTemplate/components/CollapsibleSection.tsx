'use client';
import { FC, PropsWithChildren, useCallback, useState } from 'react';

import { IconChevronDown } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props {
  title: string;
  growOnOpen?: boolean;
  defaultOpen?: boolean;
}

const CollapsibleSection: FC<PropsWithChildren<Props>> = ({
  title,
  growOnOpen = false,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <div className={classNames('min-h-0 flex flex-col', isOpen && growOnOpen && 'flex-1')}>
      <p
        className="w-full mb-4 flex items-center gap-x-2 cursor-pointer select-none dial-small-text font-semibold"
        onClick={toggle}
      >
        <IconChevronDown className={classNames('transition-transform', !isOpen && '-rotate-90')} size={16} />
        {title}
      </p>
      {isOpen && (
        <div className={classNames('min-h-0 overflow-y-auto flex flex-col', growOnOpen && 'flex-1')}>{children}</div>
      )}
    </div>
  );
};

export default CollapsibleSection;
