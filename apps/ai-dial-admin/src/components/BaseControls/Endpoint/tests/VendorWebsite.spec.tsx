import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import VendorWebsiteControl from '@/src/components/BaseControls/Endpoint/VendorWebsite';

describe('VendorWebsiteControl', () => {
  test('renders the vendor website field with its current value', () => {
    render(<VendorWebsiteControl endpoint="https://vendor.example.com" />);

    expect(screen.getByText(EntityFieldsI18nKey.vendorWebsite)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('https://vendor.example.com');
  });

  test('calls onChange with the typed value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<VendorWebsiteControl endpoint="" onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'h');

    expect(onChange).toHaveBeenCalledWith('h');
  });

  test('accepts a non-URL string with no validation error, since it is a plain string field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<VendorWebsiteControl endpoint="" onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'Acme Inc');

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true');
  });
});
