import { AutocompleteInputOption } from '@/src/components/Common/AutocompleteInput/models';

/**
 * Mirrors ui-kit's `AutocompleteTagInput` matching: label, value or description contains the query,
 * case-insensitively. With `shouldFilter` off every suggestion passes and only the cap applies.
 */
export const filterAutocompleteSuggestions = (
  suggestions: AutocompleteInputOption[],
  query: string,
  maxSuggestions: number,
  shouldFilter: boolean,
): AutocompleteInputOption[] => {
  const normalizedQuery = query.trim().toLowerCase();
  const matching = shouldFilter
    ? suggestions.filter(({ value, label, description }) =>
        [label, value, description].some((text) => text?.toLowerCase().includes(normalizedQuery)),
      )
    : suggestions;

  return matching.slice(0, Math.max(maxSuggestions, 0));
};
