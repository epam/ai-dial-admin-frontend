import classNames from 'classnames';
import React, { useCallback } from 'react';

import { AttachmentOption } from './AttachmentInput';

type Props = {
  suggestions: AttachmentOption[];
  highlightIndex: number;
  onSelectSuggestion: (suggestion: AttachmentOption) => void;
  onHightLightSuggestion: (idx: number) => void;
};

export function Suggestions({ suggestions, highlightIndex, onSelectSuggestion, onHightLightSuggestion }: Props) {
  const handleSelectSuggestion = useCallback(
    (opt: AttachmentOption): React.MouseEventHandler<HTMLLIElement> =>
      (e) => {
        e.preventDefault();
        onSelectSuggestion(opt);
      },
    [onSelectSuggestion],
  );

  const handleHightLightSuggestion = useCallback(
    (idx: number) => () => {
      onHightLightSuggestion(idx);
    },
    [onHightLightSuggestion],
  );

  return (
    <ul className="relative mt-1 w-full bg-layer-0 z-20">
      {suggestions?.map((opt, idx) => (
        <li
          key={opt.value}
          className={classNames(
            'cursor-pointer px-3 py-2 flex justify-between gap-4',
            idx === highlightIndex && 'bg-accent-primary-alpha',
          )}
          onMouseEnter={handleHightLightSuggestion(idx)}
          onMouseDown={handleSelectSuggestion(opt)}
        >
          <span className="small">{opt.label.toUpperCase()}</span>
          <span className="small text-secondary truncate">{opt.value}</span>
        </li>
      ))}
    </ul>
  );
}
