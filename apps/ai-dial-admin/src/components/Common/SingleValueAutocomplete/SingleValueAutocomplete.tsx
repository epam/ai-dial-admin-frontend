import { ChangeEventHandler, FC, KeyboardEvent, useCallback, useMemo, useState } from 'react';

import { DialErrorText, DialLabel, DialTag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import Suggestions from '@/src/components/Common/Suggestions/Suggestions';
import { MultiValueOption } from '@/src/components/Common/MultiValueAutocomplete/MultiValueAutocomplete';

interface Props {
  elementId?: string;
  label?: string;
  value: string;
  availableItems: MultiValueOption[];
  placeholder?: string;
  error?: string;
  caption?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const SingleValueAutocomplete: FC<Props> = ({
  elementId,
  label,
  value,
  availableItems,
  placeholder,
  error = '',
  caption,
  disabled = false,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filteredSuggestions = useMemo(
    () =>
      availableItems
        .filter(
          (opt) =>
            opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            opt.value.toLowerCase().includes(inputValue.toLowerCase()),
        )
        .slice(0, 5),
    [availableItems, inputValue],
  );

  const shouldShowSuggestions = useMemo(
    () => showSuggestions && filteredSuggestions.length > 0,
    [filteredSuggestions.length, showSuggestions],
  );

  const commit = useCallback(
    (item: MultiValueOption | string) => {
      const newValue = typeof item === 'string' ? item.trim() : item.value;
      if (!newValue) return;
      onChange(newValue);
      setInputValue('');
      setShowSuggestions(false);
      setHighlight(0);
    },
    [onChange],
  );

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setInputValue(e.target.value);
    setHighlight(0);
    setShowSuggestions(true);
  }, []);

  const handleRemoveValue = useCallback(() => onChange(''), [onChange]);

  const handleInputBlur = useCallback(() => setShowSuggestions(false), []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlight((h) => (h + 1) % Math.max(filteredSuggestions.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlight((h) => (h - 1 + filteredSuggestions.length) % Math.max(filteredSuggestions.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSuggestions[highlight]) {
          commit(filteredSuggestions[highlight]);
        } else if (inputValue.trim()) {
          commit(inputValue);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [commit, filteredSuggestions, highlight, inputValue],
  );

  const handleSetHighlight = useCallback((idx: number) => setHighlight(idx), []);

  const selectedLabel = useMemo(
    () => availableItems.find((opt) => opt.value === value)?.label ?? value,
    [availableItems, value],
  );

  return (
    <div className={classNames('flex flex-col gap-y-3', STANDARD_CONTROL_WIDTH)}>
      {label && <DialLabel htmlFor={elementId} label={label} />}
      <div className={classNames('dial-input h-auto min-h-[40px] p-[6px]', error && 'dial-input-error')}>
        <div className="flex flex-wrap items-center gap-2">
          {value && <DialTag label={selectedLabel} closable onRemove={handleRemoveValue} />}
          <div className="flex items-center gap-2 flex-1 min-w-[120px]">
            <input
              id={elementId}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="outline-none border-none w-full flex-1 p-1 dial-input h-auto"
              placeholder={placeholder || ''}
            />
          </div>
        </div>
      </div>

      {shouldShowSuggestions && (
        <Suggestions
          suggestions={filteredSuggestions}
          highlightIndex={highlight}
          onSelectSuggestion={commit}
          onHightLightSuggestion={handleSetHighlight}
          isUpperCased={false}
        />
      )}
      {!disabled && <DialErrorText text={error} />}
      {caption && <div className="text-secondary tiny pt-2">{caption}</div>}
    </div>
  );
};

export default SingleValueAutocomplete;
