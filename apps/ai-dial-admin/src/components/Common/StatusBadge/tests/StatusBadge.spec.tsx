import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import StatusBadge from '../StatusBadge';
import { StatusBadgeVariant } from '../models';

describe('Common components :: StatusBadge', () => {
  test('Should style the valid variant with the success tokens', () => {
    render(<StatusBadge variant={StatusBadgeVariant.Valid} label="Valid" />);

    const pill = screen.getByText('Valid').parentElement;
    expect(pill).toHaveClass('bg-success', 'text-success', 'px-2', 'py-0.5', 'rounded-[120px]', 'gap-1');
    expect(pill?.querySelector('span[aria-hidden]')).toHaveClass('bg-[currentColor]');
  });

  test('Should style the invalid variant with the error tokens', () => {
    render(<StatusBadge variant={StatusBadgeVariant.Invalid} label="Invalid" />);

    const pill = screen.getByText('Invalid').parentElement;
    expect(pill).toHaveClass('bg-error', 'text-error');
    expect(pill?.querySelector('span[aria-hidden]')).toHaveClass('bg-[currentColor]');
  });

  test('Should render no info icon without a hint', () => {
    render(<StatusBadge variant={StatusBadgeVariant.Invalid} label="Invalid" />);

    expect(screen.queryByRole('button', { name: StatusBadgeI18nKey.Details })).not.toBeInTheDocument();
  });

  test('Should show the hint when the info icon is hovered', async () => {
    render(<StatusBadge variant={StatusBadgeVariant.Invalid} label="Invalid" hint="endpoint: must not be empty" />);

    const user = userEvent.setup();
    await user.hover(screen.getByRole('button', { name: StatusBadgeI18nKey.Details }));

    expect(await screen.findByText('endpoint: must not be empty')).toBeInTheDocument();
  });

  test('Should show the hint when the info icon is focused by keyboard', async () => {
    render(<StatusBadge variant={StatusBadgeVariant.Invalid} label="Invalid" hint="endpoint: must not be empty" />);

    const user = userEvent.setup();
    await user.tab();

    expect(screen.getByRole('button', { name: StatusBadgeI18nKey.Details })).toHaveFocus();
    expect(await screen.findByText('endpoint: must not be empty')).toBeInTheDocument();
  });
});
