import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExtraDataField from './ExtraDataField';
import { BasicI18nKey, ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';

const makeEndpoint = (extraData: any) => ({ id: 'ep1', extraData }) as any;

const baseProps = {
  fieldTitle: 'Extra Data',
  disabled: false,
  onChangeExtraData: vi.fn(),
};

describe('ExtraDataField', () => {
  beforeEach(() => {
    baseProps.onChangeExtraData.mockClear();
  });

  it('renders with no extraData (NONE_ID)', () => {
    render(<ExtraDataField {...baseProps} endpoint={makeEndpoint(undefined)} />);
    expect(screen.getByText('Extra Data')).toBeInTheDocument();
    expect(screen.getByText(BasicI18nKey.None)).toBeInTheDocument();
  });

  it('renders with string extraData (USE_STRING_ID)', () => {
    render(<ExtraDataField {...baseProps} endpoint={makeEndpoint('hello')} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
