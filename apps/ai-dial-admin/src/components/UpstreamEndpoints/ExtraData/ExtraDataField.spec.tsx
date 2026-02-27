import { BasicI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ExtraDataField from './ExtraDataField';

const makeEndpoint = (extraData: any) => ({ id: 'ep1', extraData }) as any;

const baseProps = {
  label: 'Extra Data',
  disabled: false,
  onChangeExtraData: vi.fn(),
};

describe('ExtraDataField', () => {
  beforeEach(() => {
    baseProps.onChangeExtraData.mockClear();
  });

  test('renders with no extraData (NONE_ID)', () => {
    render(<ExtraDataField {...baseProps} endpoint={makeEndpoint(undefined)} />);
    expect(screen.getByText('Extra Data')).toBeInTheDocument();
    expect(screen.getByText(BasicI18nKey.None)).toBeInTheDocument();
  });

  test('renders with string extraData (USE_STRING_ID)', () => {
    render(<ExtraDataField {...baseProps} endpoint={makeEndpoint('hello')} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
