import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import FloatingFilter from './FloatingFilter';
import { BasicI18nKey } from '@/src/constants/i18n';

describe('FloatingFilter', () => {
  test('renders input and icon', () => {
    const props = {
      parentFilterInstance: vi.fn(),
      currentParentModel: () => ({ filter: 'abc' }),
    } as any;
    render(<FloatingFilter {...props} />);
    expect(screen.getByPlaceholderText(BasicI18nKey.Search)).toBeInTheDocument();
    expect(screen.getByDisplayValue('abc')).toBeInTheDocument();
  });

  test('calls parentFilterInstance on input change', () => {
    const onFloatingFilterChanged = vi.fn();
    const parentFilterInstance = (cb: any) => cb({ onFloatingFilterChanged });
    const props = {
      parentFilterInstance,
      currentParentModel: () => ({ filter: '' }),
    } as any;
    render(<FloatingFilter {...props} />);
    fireEvent.change(screen.getByPlaceholderText(BasicI18nKey.Search), { target: { value: 'test' } });
    expect(onFloatingFilterChanged).toHaveBeenCalledWith('contains', 'test');
  });

  test('input value reflects currentParentModel', () => {
    const props = {
      parentFilterInstance: vi.fn(),
      currentParentModel: () => ({ filter: 'xyz' }),
    } as any;
    render(<FloatingFilter {...props} />);
    expect(screen.getByDisplayValue('xyz')).toBeInTheDocument();
  });
});
