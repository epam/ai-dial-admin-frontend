'use client';

import { FC } from 'react';
import { DialCloseButton } from '@epam/ai-dial-ui-kit';

import { useAppContext } from '@/src/context/AppContext';

interface Props {
  title: string;
  text: string;
}

const Hint: FC<Props> = ({ title, text }) => {
  const { closeHintSidebar } = useAppContext().hintSidebar;

  return (
    <div className="flex flex-col w-full gap-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-primary overflow-ellipsis">{title}</h3>
        <DialCloseButton onClose={closeHintSidebar} />
      </div>
      <div className="overflow-y-scroll">
        <p className="small text-primary">{text}</p>
      </div>
    </div>
  );
};

export default Hint;
