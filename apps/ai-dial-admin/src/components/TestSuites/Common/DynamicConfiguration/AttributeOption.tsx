'use client';

import { FC } from 'react';

import { DialTag, DialTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

interface Props {
  field: TestCaseSchema;
  isSelected: boolean;
  onPick: () => void;
}

// A schema description runs from a short example value to a full sentence, so the row shows it
// truncated on a line of its own and keeps the whole of it reachable through one row-level tooltip —
// the name truncates into that same tooltip rather than nesting a second one.
const AttributeOption: FC<Props> = ({ field, isSelected, onPick }) => (
  <DialTooltip
    hideTooltip={!field.description}
    tooltip={field.description}
    triggerClassName="w-full"
    contentClassName="max-w-[320px]"
  >
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      className={classNames(
        'flex w-full flex-col items-start justify-center gap-1 px-3 py-2 text-left',
        'hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha focus-visible:outline-none',
        isSelected && 'bg-accent-primary-alpha',
      )}
      onClick={onPick}
    >
      <span className="flex w-full items-center gap-2">
        <span className="truncate dial-small-text text-primary">{field.name}</span>
        {/* The schema enum is upper-case on the wire; the design shows the type as it reads in a JSON schema. */}
        <DialTag label={field.type.toLowerCase()} />
      </span>
      {field.description && <span className="w-full truncate dial-tiny-text text-secondary">{field.description}</span>}
    </button>
  </DialTooltip>
);

export default AttributeOption;
