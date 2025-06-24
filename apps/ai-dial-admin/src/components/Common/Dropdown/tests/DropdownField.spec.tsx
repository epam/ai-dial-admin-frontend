import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DropdownField from '../DropdownField';

describe('Common components :: DropdownField', () => {
  const items: DropdownItemsModel[] = [
    { id: '1', name: 'Item One' },
    { id: '2', name: 'Item Two' },
  ];

  test('Should render label and dropdown items', () => {
    render(
      <DropdownField fieldTitle="Dropdown Label" elementId="dropdown-id" items={items} onChange={vi.fn()}>
        <span>Custom Child</span>
      </DropdownField>,
    );
    expect(screen.getByText('Dropdown Label')).toBeInTheDocument();
  });

  test('Should render (Optional) when optional is true', () => {
    render(
      <DropdownField fieldTitle="Dropdown Label" elementId="dropdown-id" items={items} onChange={vi.fn()} optional />,
    );
    expect(screen.getByText(/Optional/)).toBeInTheDocument();
  });
});
