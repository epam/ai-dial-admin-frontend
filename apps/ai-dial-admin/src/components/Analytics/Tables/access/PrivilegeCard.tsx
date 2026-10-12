'use client';

import { Checkbox } from '@epam/ai-dial-ui-kit';
import { FC, ReactNode } from 'react';

interface Props {
  label: string;
  isSelected: boolean;
  isDisabled?: boolean;
  caption?: string;
  children?: ReactNode;
  onChange: (isSelected: boolean) => void;
}

const PrivilegeCard: FC<Props> = ({ label, isSelected, isDisabled, caption, children, onChange }) => (
  <div className="flex flex-col gap-2 rounded-xl bg-layer-4 p-3">
    <div className="flex items-center gap-2">
      <Checkbox labelProps={{ label }} isSelected={isSelected} disabled={isDisabled} onChange={onChange} />
      {caption && <span className="dial-small-text text-secondary">{caption}</span>}
    </div>
    {children}
  </div>
);

export default PrivilegeCard;
