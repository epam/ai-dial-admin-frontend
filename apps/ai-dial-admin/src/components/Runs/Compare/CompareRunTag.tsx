'use client';

import { IconPencil } from '@tabler/icons-react';
import { FC } from 'react';

import { DialTag } from '@epam/ai-dial-ui-kit';

interface Props {
  label: string;
  onEdit: () => void;
  isEditDisabled?: boolean;
}

const CompareRunTag: FC<Props> = ({ label, onEdit, isEditDisabled }) => {
  return (
    <DialTag
      label={label}
      icon={<IconPencil size={12} className="shrink-0 text-secondary" />}
      onClick={isEditDisabled ? undefined : onEdit}
      className={`bg-layer-3 border-0 flex-row-reverse gap-1 ${isEditDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    />
  );
};

export default CompareRunTag;
