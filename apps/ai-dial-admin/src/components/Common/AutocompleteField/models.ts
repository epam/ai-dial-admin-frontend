import { ChangeEventHandler, KeyboardEventHandler } from 'react';

export interface MultiValueOption {
  label: string;
  value: string;
}

export interface AutocompleteState {
  inputValue: string;
  highlight: number;
  filteredSuggestions: MultiValueOption[];
  shouldShowSuggestions: boolean;
  commit: (item: MultiValueOption | string) => void;
  onInputChange: ChangeEventHandler<HTMLInputElement>;
  onInputBlur: () => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onHighlight: (index: number) => void;
}
