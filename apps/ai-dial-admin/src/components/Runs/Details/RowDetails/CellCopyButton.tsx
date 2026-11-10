'use client';

import { FC } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props {
  label: string;
  value: string;
}

/**
 * Copies a panel cell's full value. Sits in the cell's top-right corner and shows on cell hover or
 * keyboard focus; the cell must be `relative` and carry the `group/cell` class.
 */
const CellCopyButton: FC<Props> = ({ label, value }) => (
  <CopyButton
    className="absolute right-1 top-1 z-10 rounded-xs bg-layer-4 opacity-0 transition-opacity group-hover/cell:opacity-100 focus-visible:opacity-100"
    size={ElementSize.Small}
    valueLabel={label}
    value={value}
  />
);

export default CellCopyButton;
