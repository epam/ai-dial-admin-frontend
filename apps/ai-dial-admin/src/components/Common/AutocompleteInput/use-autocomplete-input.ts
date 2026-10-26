import { KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react';

import { AutocompleteInputOption, UseAutocompleteInputParams } from '@/src/components/Common/AutocompleteInput/models';
import { filterAutocompleteSuggestions } from '@/src/components/Common/AutocompleteInput/utils';

const NO_HIGHLIGHT = -1;
const DEFAULT_MAX_SUGGESTIONS = 5;

/**
 * Unlike the kit's tag input, typing highlights nothing: the typed text is itself a valid value, so
 * Enter commits it rather than swapping in the first suggestion. A row is picked only after the user
 * moves to it.
 */
export const useAutocompleteInput = ({
  value,
  suggestions,
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
  openOnFocus = false,
  shouldFilterSuggestions = true,
  disabled = false,
  readOnly = false,
  onChange,
  onSelect,
  onCommit,
}: UseAutocompleteInputParams) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(NO_HIGHLIGHT);
  // Set by a pick or an Enter commit, cleared by the next edit: the blur that follows must not
  // commit the same text a second time.
  const isSettledRef = useRef(false);

  const isInteractive = !disabled && !readOnly;
  const isEmpty = !value.trim();

  const visibleSuggestions = useMemo(
    () =>
      filterAutocompleteSuggestions(
        suggestions,
        value,
        openOnFocus && isEmpty ? suggestions.length : maxSuggestions,
        shouldFilterSuggestions,
      ),
    [suggestions, value, openOnFocus, isEmpty, maxSuggestions, shouldFilterSuggestions],
  );

  const isListOpen = isOpen && isInteractive && visibleSuggestions.length > 0;
  const activeIndex = Math.min(highlight, visibleSuggestions.length - 1);
  const hasActive = isListOpen && activeIndex >= 0;

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlight(NO_HIGHLIGHT);
  }, []);

  const pick = useCallback(
    (option: AutocompleteInputOption) => {
      isSettledRef.current = true;
      if (onSelect) {
        onSelect(option);
      } else {
        onChange(option.value);
      }
      close();
    },
    [onSelect, onChange, close],
  );

  const commit = useCallback(() => {
    isSettledRef.current = true;
    onCommit?.(value);
    close();
  }, [onCommit, value, close]);

  const onInputChange = useCallback(
    (text?: string) => {
      const next = (text ?? '').trimStart();
      isSettledRef.current = false;
      onChange(next);
      setIsOpen(!!next.trim() || openOnFocus);
      setHighlight(NO_HIGHLIGHT);
    },
    [onChange, openOnFocus],
  );

  const onInputFocus = useCallback(() => {
    if (openOnFocus && isInteractive) {
      setIsOpen(true);
      setHighlight(NO_HIGHLIGHT);
    }
  }, [openOnFocus, isInteractive]);

  const onInputBlur = useCallback(() => {
    close();
    if (isSettledRef.current) {
      isSettledRef.current = false;
      return;
    }
    onCommit?.(value);
  }, [close, onCommit, value]);

  const onInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isInteractive) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault();
          const step = event.key === 'ArrowDown' ? 1 : -1;
          if (!isListOpen) {
            setIsOpen(true);
            setHighlight(step === 1 ? 0 : visibleSuggestions.length - 1);
            return;
          }
          const from = activeIndex < 0 ? Math.min(-step, 0) : activeIndex;
          setHighlight((from + step + visibleSuggestions.length) % visibleSuggestions.length);
          return;
        }
        case 'Enter':
          event.preventDefault();
          if (hasActive) {
            pick(visibleSuggestions[activeIndex]);
          } else {
            commit();
          }
          return;
        case 'Escape':
          // An open list takes this Escape for itself; otherwise a surrounding popup's dismiss
          // listener on `document` closes the whole popup. A second Escape reaches it as usual.
          if (isListOpen) {
            event.preventDefault();
            event.stopPropagation();
          }
          close();
          return;
      }
    },
    [isInteractive, isListOpen, visibleSuggestions, activeIndex, hasActive, pick, commit, close],
  );

  return {
    visibleSuggestions,
    isListOpen,
    activeIndex: hasActive ? activeIndex : NO_HIGHLIGHT,
    setHighlight,
    pick,
    onInputChange,
    onInputFocus,
    onInputBlur,
    onInputKeyDown,
  };
};
