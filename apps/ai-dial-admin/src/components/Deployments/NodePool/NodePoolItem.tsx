'use client';

import classNames from 'classnames';
import { FC } from 'react';
import { Label, Radio } from '@epam/ai-dial-ui-kit';

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
    <Label
      htmlFor={inputId}
      className="grid grid-cols-[36px_1fr] gap-3 items-start cursor-pointer px-4 py-3"
      label={
        <>
          <Radio name={radioName} id={inputId} value={value} isSelected={checked} onChange={onSelect} />
          <NodePoolInfo name={name} poolId={poolId} caption={description} />
        </>
      }
    />
  </li>
);

export default NodePoolItem;
