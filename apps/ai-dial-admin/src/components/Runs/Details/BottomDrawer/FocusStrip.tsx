import { FC } from 'react';

import { IconX } from '@tabler/icons-react';

import { ComparisonRow } from './types';
import { formatFieldValue } from './utils';

interface Props {
  rows: ComparisonRow[];
  onRemove: (fieldKey: string) => void;
}

const FocusStrip: FC<Props> = ({ rows, onRemove }) => {
  if (rows.length === 0) return null;

  return (
    <div
      className="flex gap-2 px-3 py-1.5 border-b border-secondary overflow-x-auto shrink-0"
      data-testid="focus-strip"
    >
      {rows.map((row) => (
        <div
          key={row.fieldKey}
          className="flex flex-col gap-0.5 bg-layer-2 rounded px-2 py-1 min-w-[140px] max-w-[220px] shrink-0"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xxs font-mono font-medium text-primary truncate">{row.label}</span>
            <button onClick={() => onRemove(row.fieldKey)} className="text-secondary hover:text-primary shrink-0">
              <IconX size={12} />
            </button>
          </div>
          {row.values.map((val, idx) => (
            <span key={idx} className="text-xxs text-secondary truncate">
              {formatFieldValue(val.raw)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default FocusStrip;
