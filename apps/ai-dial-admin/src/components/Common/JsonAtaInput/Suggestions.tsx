import classNames from 'classnames';
import { FC, MouseEventHandler, useCallback } from 'react';

export interface SuggestionOption {
  label: string;
  value: string;
  type: string;
}

interface Props {
  suggestions: SuggestionOption[];
  highlightIndex: number;
  onSelectSuggestion: (suggestion: SuggestionOption) => void;
  onHighlightSuggestion: (idx: number) => void;
}

const Suggestions: FC<Props> = ({ suggestions, highlightIndex, onSelectSuggestion, onHighlightSuggestion }) => {
  const handleSelectSuggestion = useCallback(
    (opt: SuggestionOption): MouseEventHandler<HTMLLIElement> =>
      (e) => {
        e.preventDefault();
        onSelectSuggestion(opt);
      },
    [onSelectSuggestion],
  );

  const handleHighlightSuggestion = useCallback(
    (idx: number): MouseEventHandler<HTMLLIElement> =>
      () => {
        onHighlightSuggestion(idx);
      },
    [onHighlightSuggestion],
  );

  return (
    <ul className="absolute inset-x-0 bottom-full mb-1 bg-layer-0 z-50 max-h-[200px] overflow-y-auto shadow-md rounded-md">
      {suggestions.map((option, idx) => (
        <li
          key={option.value}
          className={classNames(
            'cursor-pointer px-3 py-2 flex justify-between gap-4',
            idx === highlightIndex && 'bg-accent-primary-alpha',
          )}
          onMouseEnter={handleHighlightSuggestion(idx)}
          onMouseDown={handleSelectSuggestion(option)}
        >
          <span className="small font-medium">{option.label}</span>
          <span className="small text-secondary truncate">{option.type}</span>
        </li>
      ))}
    </ul>
  );
};

export default Suggestions;
