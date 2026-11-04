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

  test('makes the list scroller the containing block of the sr-only checkbox inputs so the backdrop is not stretched', async () => {
    const user = userEvent.setup();
    render(<Multiselect elementId="id" label="Title" heading="Topics" selectedItems={['a']} allItems={['a']} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));

    expect(screen.getByRole('list')).toHaveClass('relative', 'overflow-auto');
  });
});
