import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ExtraDataCellRenderer from '../ExtraDataCellRenderer';

vi.mock('@/src/utils/validation/is-valid-json', () => ({
  isJSON: (val: string) => val === '{"a":1}',
}));

describe('ExtraDataCellRenderer', () => {
  test('renders value and json icon if value is JSON', () => {
    render(<ExtraDataCellRenderer value='{"a":1}' />);
    expect(screen.getByText('{"a":1}')).toBeInTheDocument();
  });

  test('renders value without json icon if value is not JSON', () => {
    render(<ExtraDataCellRenderer value="not-json" />);
    expect(screen.getByText('not-json')).toBeInTheDocument();
  });
});
