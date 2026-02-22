'use client';
import { FC, PropsWithChildren, useCallback, useState } from 'react';

import { IconChevronDown } from '@tabler/icons-react';

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
    <div className={`${isOpen && growOnOpen ? 'flex-1' : ''} min-h-0 flex flex-col`}>
      <h3 className="w-full mb-4 flex items-center gap-x-2 cursor-pointer select-none" onClick={toggle}>
        <IconChevronDown className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} size={16} />
        {title}
      </h3>
      {isOpen && (
        <div className={`${growOnOpen ? 'flex-1' : ''} min-h-0 overflow-y-auto flex flex-col`}>{children}</div>
      )}
    </div>
  );
};

export default CollapsibleSection;
