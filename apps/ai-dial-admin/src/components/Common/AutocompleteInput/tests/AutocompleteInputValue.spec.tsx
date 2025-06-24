import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import AutocompleteInputValue from '../AutocompleteInputValue';

describe('AutocompleteInputValue', () => {
  test('renders selected items as list items', () => {
    render(<AutocompleteInputValue selectedItems={['val1', 'val2']} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('val1');
    expect(items[1]).toHaveTextContent('val2');
  });
});
