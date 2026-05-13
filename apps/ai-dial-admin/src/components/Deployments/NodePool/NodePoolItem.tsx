'use client';

import classNames from 'classnames';
import { FC } from 'react';
import { DialRadioButton } from '@epam/ai-dial-ui-kit';

interface Props {
  radioName: string;
  inputId: string;
  value: string;
  name: string;
  description?: string;
  poolId?: string;
  checked: boolean;
  onSelect: (value: string) => void;
}

const NodePoolItem: FC<Props> = ({ radioName, inputId, value, name, description, poolId, checked, onSelect }) => (
  <li
    className={classNames(
      'border-b border-primary last:border-b-0',
      checked ? 'bg-accent-primary-alpha' : 'hover:bg-layer-3',
    )}
  >
    <label htmlFor={inputId} className="grid grid-cols-[36px_1fr_1.5fr] gap-3 items-center cursor-pointer px-4 py-3">
      <DialRadioButton name={radioName} inputId={inputId} value={value} checked={checked} onChange={onSelect} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="dial-small-semi-text text-primary truncate" title={name}>
          {name}
        </span>
        {poolId && (
          <span className="font-mono dial-tiny-text text-secondary truncate" title={poolId}>
            {poolId}
          </span>
        )}
      </div>
      <span className="dial-small-text text-secondary truncate" title={description || ''}>
        {description || ''}
      </span>
    </label>
  </li>
);

export default NodePoolItem;
