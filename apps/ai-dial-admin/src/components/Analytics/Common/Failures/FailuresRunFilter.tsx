import { FC } from 'react';

import { Tag } from '@epam/ai-dial-ui-kit';

interface Props {
  label: string;
  removeLabel: string;
  isDisabled?: boolean;
  onClear: () => void;
}

const FailuresRunFilter: FC<Props> = ({ label, removeLabel, isDisabled, onClear }) => (
  <Tag label={label} closable disabled={isDisabled} removeLabel={removeLabel} onRemove={onClear} />
);

export default FailuresRunFilter;
