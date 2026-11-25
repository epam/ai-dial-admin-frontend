import { ChangeEventHandler, KeyboardEvent, useCallback, useMemo, useState } from 'react';

import { AutocompleteState, MultiValueOption } from '@/src/components/Common/AutocompleteField/models';

const MAX_SUGGESTIONS = 5;

interface Options {
  availableItems: MultiValueOption[];
  excludedValues?: string[];
  addKeys?: string[];
  onSelect: (item: MultiValueOption) => void;
}

const NO_EXCLUDED_VALUES: string[] = [];
const NO_ADD_KEYS: string[] = [];

export const useAutocomplete = ({
  availableItems,
  excludedValues = NO_EXCLUDED_VALUES,
  addKeys = NO_ADD_KEYS,
  onSelect,
}: Options): AutocompleteState => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const filteredSuggestions = useMemo(() => {
    const query = inputValue.toLowerCase();
    return availableItems
      .filter(
        (opt) =>
          !excludedValues.includes(opt.value) &&
          (opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [availableItems, excludedValues, inputValue]);

  const shouldShowSuggestions = showSuggestions && filteredSuggestions.length > 0;

  const commit = useCallback(
    (item: MultiValueOption | string) => {
      const option = typeof item === 'string' ? { label: item.trim(), value: item.trim() } : item;
      if (!option.value || excludedValues.includes(option.value)) return;
      onSelect(option);
      setInputValue('');
      setShowSuggestions(false);
      setHighlight(0);
    },
    [excludedValues, onSelect],
  );

  const onInputChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setInputValue(e.target.value);
    setHighlight(0);
    setShowSuggestions(true);
  }, []);

  const onInputBlur = useCallback(() => setShowSuggestions(false), []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const count = Math.max(filteredSuggestions.length, 1);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlight((h) => (h + 1) % count);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlight((h) => (h - 1 + count) % count);
      } else if (e.key === 'Enter' || addKeys.includes(e.key)) {
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
    [addKeys, commit, filteredSuggestions, highlight, inputValue],
  );

  const onHighlight = useCallback((index: number) => setHighlight(index), []);

  return {
    inputValue,
    highlight,
    filteredSuggestions,
    shouldShowSuggestions,
    commit,
    onInputChange,
    onInputBlur,
    onKeyDown,
    onHighlight,
  };
};
