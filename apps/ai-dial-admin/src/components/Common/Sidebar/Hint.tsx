'use client';

import { FC } from 'react';
import { DialCloseButton } from '@epam/ai-dial-ui-kit';

import { useAppContext } from '@/src/context/AppContext';

interface Props {
  title: string;
  text: string;
}

const Hint: FC<Props> = ({ title, text }) => {
  const { closeSidebar } = useAppContext().sidebar;

  return (
    <div className="flex flex-col gap-y-8 w-[400px]">
      <div className="flex items-center justify-between">
        <h3 className="truncate">{title}</h3>
        <DialCloseButton onClose={closeSidebar} />
      </div>
      <div className="overflow-y-auto">
        <p className="dial-small-text">{text}</p>
      </div>
    </div>
  );
};

export default Hint;
