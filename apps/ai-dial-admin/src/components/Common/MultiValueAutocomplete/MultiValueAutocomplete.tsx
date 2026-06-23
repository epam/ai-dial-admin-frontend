import { ChangeEventHandler, FC, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialErrorText, DialTag } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import Suggestions from '@/src/components/Common/AttachmentInput/Suggestions';

export interface MultiValueOption {
  label: string;
  value: string;
}

interface Props {
  selected: MultiValueOption[];
  availableItems: MultiValueOption[];
  placeholder?: string;
  error?: string;
  isReadOnlyAdmin?: boolean;
  caption?: string;
  onAdd: (item: MultiValueOption) => void;
  onRemove: (index: number) => void;
}

const MultiValueAutocomplete: FC<Props> = ({
  selected,
  availableItems,
  placeholder,
  error = '',
  isReadOnlyAdmin = false,
  caption,
  onAdd,
  onRemove,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [wraps, setWraps] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filteredSuggestions = useMemo(
    () =>
      availableItems
        .filter(
          (opt) =>
            !selected.some((s) => s.value === opt.value) &&
            (opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
              opt.value.toLowerCase().includes(inputValue.toLowerCase())),
        )
        .slice(0, 5),
    [availableItems, inputValue, selected],
  );

  const shouldShowSuggestions = useMemo(
    () => showSuggestions && filteredSuggestions.length > 0,
    [filteredSuggestions.length, showSuggestions],
  );

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setWraps(containerRef.current.scrollHeight > containerRef.current.clientHeight + 10);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const addItem = useCallback(
    (item: MultiValueOption | string) => {
      let newItem: MultiValueOption;
      if (typeof item === 'string') {
        if (!item.trim()) return;
        newItem = { label: item.trim(), value: item.trim() };
      } else {
        newItem = item;
      }
      if (selected.some((s) => s.value === newItem.value)) return;
      onAdd(newItem);
      setInputValue('');
      setShowSuggestions(false);
      setHighlight(0);
    },
    [selected, onAdd],
  );

  const handleRemoveItem = useCallback((idx: number) => () => onRemove(idx), [onRemove]);

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setInputValue(e.target.value);
    setHighlight(0);
    setShowSuggestions(true);
  }, []);

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
      } else if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (filteredSuggestions[highlight]) {
          addItem(filteredSuggestions[highlight]);
        } else if (inputValue.trim()) {
          addItem(inputValue);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [addItem, filteredSuggestions, highlight, inputValue],
  );

  const handleSetHighlight = useCallback((idx: number) => setHighlight(idx), []);

  return (
    <div className={classNames('flex flex-col gap-y-1', STANDARD_CONTROL_WIDTH)}>
      <div className={classNames('dial-input h-auto min-h-[40px] p-[6px]', error && 'dial-input-error')}>
        <div
          ref={containerRef}
          className={classNames('flex flex-wrap items-start gap-2', wraps ? 'flex-col-reverse' : 'flex-row')}
        >
          {selected.map((att, idx) => (
            <DialTag key={att.value} label={att.label} closable onRemove={handleRemoveItem(idx)} />
          ))}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <input
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              disabled={isReadOnlyAdmin}
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
          onSelectSuggestion={addItem}
          onHightLightSuggestion={handleSetHighlight}
        />
      )}
      {!isReadOnlyAdmin && <DialErrorText text={error} />}
      {caption && <div className="text-secondary tiny pt-2">{caption}</div>}
    </div>
  );
};

export default MultiValueAutocomplete;
