'use client';

import { FC } from 'react';

import SidePanel from '@/src/components/Common/SidePanel/SidePanel';

interface Props {
  title: string;
  text: string;
  onClose: () => void;
}

const Hint: FC<Props> = ({ title, text, onClose }) => {
  return (
    <SidePanel label={<h3 className="truncate">{title}</h3>} isOpen={true} onClose={onClose} className="w-[400px]">
      <div className="overflow-y-auto">
        <p className="dial-small-text">{text}</p>
      </div>
    </SidePanel>
  );
};

export default Hint;
