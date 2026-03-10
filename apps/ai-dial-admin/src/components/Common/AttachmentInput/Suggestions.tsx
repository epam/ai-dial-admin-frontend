import classNames from 'classnames';
import React, { FC, MouseEventHandler, useCallback } from 'react';

import { AttachmentOption } from './AttachmentInput';

interface Props {
  suggestions: AttachmentOption[];
  highlightIndex: number;
  onSelectSuggestion: (suggestion: AttachmentOption) => void;
  onHightLightSuggestion: (idx: number) => void;
}

const Suggestions: FC<Props> = ({ suggestions, highlightIndex, onSelectSuggestion, onHightLightSuggestion }) => {
  const handleSelectSuggestion = useCallback(
    (opt: AttachmentOption): MouseEventHandler<HTMLLIElement> =>
      (e) => {
        e.preventDefault();
        onSelectSuggestion(opt);
      },
    [onSelectSuggestion],
  );

  const handleHightLightSuggestion = useCallback(
    (idx: number): MouseEventHandler<HTMLLIElement> =>
      () => {
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
};

export default Suggestions;
