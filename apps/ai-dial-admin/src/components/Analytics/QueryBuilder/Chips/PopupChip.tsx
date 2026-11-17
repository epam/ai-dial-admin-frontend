'use client';

import { FC, ReactNode, useId, useState } from 'react';

import Chip from '@/src/components/Analytics/QueryBuilder/Chips/Chip';
import ChipPopup from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopup';
import { ChipPanelProps } from '@/src/components/Analytics/QueryBuilder/Chips/models';

interface Props {
  prefix?: string;
  label: string;
  widthClassName?: string;
  renderPanel: (props: ChipPanelProps) => ReactNode;
}

const PopupChip: FC<Props> = ({ prefix, label, widthClassName, renderPanel }) => {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChipPopup
      titleId={titleId}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      widthClassName={widthClassName}
      panel={renderPanel({ titleId, onClose: () => setIsOpen(false) })}
    >
      <Chip prefix={prefix} label={label} isOpen={isOpen} />
    </ChipPopup>
  );
};

export default PopupChip;
