'use client';

import { DialCloseButton } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode } from 'react';
import classNames from 'classnames';

interface Props {
  label: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const SidePanel: FC<Props> = ({ label, isOpen, onClose, children, className }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={classNames('flex flex-col lg:w-[420px] p-4 border border-primary rounded h-full', className)}>
      <div className="flex flex-row justify-between items-center mb-4">
        {typeof label === 'string' ? <span className="dial-tiny-text text-secondary">{label}</span> : label}
        <DialCloseButton className="h-[24px]" size={24} onClose={onClose} />
      </div>
      {children}
    </div>
  );
};

export default SidePanel;
