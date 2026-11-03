import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import Multiselect from './Multiselect';

describe('Multiselect', () => {
  test('renders field title and error text', () => {
    render(<Multiselect elementId="id" label="Title" errorText="Error!" />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  test('keeps the modal inside the backdrop so the backdrop does not scroll', async () => {
    const user = userEvent.setup();
    render(<Multiselect elementId="id" label="Title" heading="Topics" selectedItems={['a']} allItems={['a']} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-h-full');
    expect(dialog).not.toHaveClass('max-h-screen');
    expect(dialog.parentElement).toHaveStyle({ overflow: 'hidden' });
  });
});
