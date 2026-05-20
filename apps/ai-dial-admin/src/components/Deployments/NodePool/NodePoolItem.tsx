'use client';

import classNames from 'classnames';
import { FC } from 'react';
import { DialLabel, DialRadioButton } from '@epam/ai-dial-ui-kit';

import NodePoolInfo from '@/src/components/Deployments/NodePool/NodePoolInfo';

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
    <DialLabel
      htmlFor={inputId}
      className="grid grid-cols-[36px_1fr_1.5fr] gap-3 items-center cursor-pointer px-4 py-3"
      label={
        <>
          <DialRadioButton name={radioName} inputId={inputId} value={value} checked={checked} onChange={onSelect} />
          <NodePoolInfo name={name} poolId={poolId} />
          <span className="dial-small-text text-secondary truncate" title={description || ''}>
            {description || ''}
          </span>
        </>
      }
    />
  </li>
);

export default NodePoolItem;
