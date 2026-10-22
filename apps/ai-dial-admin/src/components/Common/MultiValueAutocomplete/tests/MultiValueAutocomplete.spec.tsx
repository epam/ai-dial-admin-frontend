import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import MultiValueAutocomplete from '@/src/components/Common/MultiValueAutocomplete/MultiValueAutocomplete';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const selected = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
];

describe('MultiValueAutocomplete', () => {
  test('renders a tag with a distinct remove button per selected value', () => {
    render(<MultiValueAutocomplete selected={selected} availableItems={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${ButtonsI18nKey.Remove} Alpha` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${ButtonsI18nKey.Remove} Beta` })).toBeInTheDocument();
  });

  test('removes the clicked value by index', () => {
    const onRemove = vi.fn();
    render(<MultiValueAutocomplete selected={selected} availableItems={[]} onAdd={vi.fn()} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Remove} Beta` }));

    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
