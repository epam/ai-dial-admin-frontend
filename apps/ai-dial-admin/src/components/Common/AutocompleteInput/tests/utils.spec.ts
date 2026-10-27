import { describe, expect, test } from 'vitest';

import { filterAutocompleteSuggestions } from '@/src/components/Common/AutocompleteInput/utils';

const suggestions = [
  { value: 'alpha', label: 'alpha' },
  { value: 'beta', label: 'beta', description: 'second' },
  { value: 'org/server@1.2.0', label: 'org/server', description: '1.2.0' },
  { value: 'alphabet', label: 'alphabet' },
];

describe('filterAutocompleteSuggestions', () => {
  test('matches the label case-insensitively', () => {
    expect(filterAutocompleteSuggestions(suggestions, 'ALP', 5, true).map((s) => s.value)).toEqual([
      'alpha',
      'alphabet',
    ]);
  });

  test('matches the value and the description', () => {
    expect(filterAutocompleteSuggestions(suggestions, '@1.2', 5, true).map((s) => s.label)).toEqual(['org/server']);
    expect(filterAutocompleteSuggestions(suggestions, 'second', 5, true).map((s) => s.value)).toEqual(['beta']);
  });

  test('ignores surrounding whitespace in the query', () => {
    expect(filterAutocompleteSuggestions(suggestions, '  beta ', 5, true)).toHaveLength(1);
  });

  test('an empty query matches everything', () => {
    expect(filterAutocompleteSuggestions(suggestions, '', 10, true)).toHaveLength(4);
  });

  test('caps the result at maxSuggestions', () => {
    expect(filterAutocompleteSuggestions(suggestions, '', 2, true)).toHaveLength(2);
    expect(filterAutocompleteSuggestions(suggestions, '', -1, true)).toHaveLength(0);
  });

  test('with filtering off, keeps every suggestion up to the cap', () => {
    expect(filterAutocompleteSuggestions(suggestions, 'zzz', 3, false).map((s) => s.value)).toEqual([
      'alpha',
      'beta',
      'org/server@1.2.0',
    ]);
  });
});
