import { ElementSize, LabelProps } from '@epam/ai-dial-ui-kit';

export interface AutocompleteInputOption {
  value: string;
  label: string;
  description?: string;
}

export interface AutocompleteInputProps {
  id?: string;
  /** The field's text — a free-text value, not necessarily one of `suggestions`. */
  value: string;
  suggestions: AutocompleteInputOption[];
  maxSuggestions?: number;
  openOnFocus?: boolean;
  /** `false` shows every suggestion as passed, for lists the server already filtered. */
  shouldFilterSuggestions?: boolean;
  size?: ElementSize;
  labelProps?: LabelProps;
  placeholder?: string;
  caption?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Suggestions are being fetched; shows a spinner inside the field. */
  isLoading?: boolean;
  ariaLabel?: string;
  listLabel?: string;
  className?: string;
  fieldClassName?: string;
  listClassName?: string;
  /** Every edit of the text. */
  onChange: (text: string) => void;
  /** A picked suggestion; without it a pick reports `onChange(option.value)`. */
  onSelect?: (option: AutocompleteInputOption) => void;
  /** The text the user left the field with, or pressed Enter on with nothing highlighted. */
  onCommit?: (text: string) => void;
}

export type UseAutocompleteInputParams = Pick<
  AutocompleteInputProps,
  | 'value'
  | 'suggestions'
  | 'maxSuggestions'
  | 'openOnFocus'
  | 'shouldFilterSuggestions'
  | 'disabled'
  | 'readOnly'
  | 'onChange'
  | 'onSelect'
  | 'onCommit'
>;
