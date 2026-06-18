import { BasicI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ExtraDataField from './ExtraDataField';

const baseProps = {
  label: 'Extra Data',
  disabled: false,
  onChange: vi.fn(),
};

describe('ExtraDataField', () => {
  beforeEach(() => {
    baseProps.onChange.mockClear();
  });

  test('renders with no value (NONE_ID)', () => {
    render(<ExtraDataField {...baseProps} value={undefined} />);
    expect(screen.getByText('Extra Data')).toBeInTheDocument();
    expect(screen.getByText(BasicI18nKey.None)).toBeInTheDocument();
  });

  test('renders with string value (USE_STRING_ID)', () => {
    render(<ExtraDataField {...baseProps} value="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
