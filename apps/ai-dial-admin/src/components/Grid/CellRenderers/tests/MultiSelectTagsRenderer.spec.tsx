import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import MultiSelectTagsRenderer from '@/src/components/Grid/CellRenderers/MultiSelectTagsRenderer';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('MultiSelectTagsRenderer', () => {
  test('renders the option label for each item, falling back to the raw value', () => {
    render(<MultiSelectTagsRenderer items={['a', 'zzz']} options={options} />);

    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
    expect(screen.getAllByText('zzz').length).toBeGreaterThan(0);
  });

  test('names each remove button after its tag and reports the removed value', () => {
    const handleRemoveTag = vi.fn();
    render(<MultiSelectTagsRenderer items={['a']} options={options} handleRemoveTag={handleRemoveTag} />);

    const [removeButton] = screen.getAllByRole('button', { name: `${ButtonsI18nKey.Remove} Alpha` });
    fireEvent.click(removeButton);

    expect(handleRemoveTag).toHaveBeenCalledWith(expect.anything(), 'a');
  });
});
