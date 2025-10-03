'use client';

import { FC } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import CloseButton from '@/src/components/Common/CloseButton/CloseButton';

interface Props {
  title: string;
  text: string;
}

const Hint: FC<Props> = ({ title, text }) => {
  const { closeHintSidebar } = useAppContext().hintSidebar;

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-primary overflow-ellipsis">{title}</h3>
        <CloseButton onClose={closeHintSidebar} />
      </div>
      <div className="overflow-y-scroll">
        <p className="small text-primary">{text}</p>
      </div>
    </div>
  );
};

export default Hint;
