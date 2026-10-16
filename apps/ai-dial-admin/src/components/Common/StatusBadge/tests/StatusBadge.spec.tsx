import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import StatusBadge from '../StatusBadge';
import { StatusBadgeLeading, StatusBadgeTone } from '../models';

describe('Common components :: StatusBadge', () => {
  test.each([
    [StatusBadgeTone.Success, ['bg-success', 'text-success']],
    [StatusBadgeTone.Error, ['bg-error', 'text-error']],
    [StatusBadgeTone.Info, ['bg-info', 'text-info']],
    [StatusBadgeTone.Neutral, ['bg-layer-4', 'text-secondary']],
  ])('Should style the %s tone with theme tokens', (tone, classes) => {
    render(<StatusBadge tone={tone} label="Label" />);

    expect(screen.getByText('Label').parentElement).toHaveClass(
      ...classes,
      'px-2',
      'py-0.5',
      'rounded-[120px]',
      'gap-1',
    );
  });

  test('Should render a decorative dot by default', () => {
    render(<StatusBadge tone={StatusBadgeTone.Success} label="Label" />);

    const slot = screen.getByText('Label').parentElement?.querySelector('[aria-hidden]');
    expect(slot).toHaveClass('size-3');
    expect(slot?.firstElementChild).toHaveClass('bg-[currentColor]', 'rounded-full');
  });

  test('Should render a spinner in the leading slot', () => {
    render(<StatusBadge tone={StatusBadgeTone.Info} label="Label" leading={StatusBadgeLeading.Spinner} />);

    expect(screen.getByRole('img', { name: 'Loading', hidden: true })).toBeInTheDocument();
  });

  test('Should render only the label without a leading indicator', () => {
    render(<StatusBadge tone={StatusBadgeTone.Success} label="Label" leading={StatusBadgeLeading.None} />);

    expect(screen.getByText('Label').parentElement?.querySelector('[aria-hidden]')).toBeNull();
    expect(screen.getByText('Label').parentElement?.children).toHaveLength(1);
  });

  test('Should render no info icon without a hint', () => {
    render(<StatusBadge tone={StatusBadgeTone.Error} label="Label" />);

    expect(screen.queryByRole('button', { name: StatusBadgeI18nKey.Details })).not.toBeInTheDocument();
  });

  test('Should show the hint when the info icon is hovered', async () => {
    render(<StatusBadge tone={StatusBadgeTone.Error} label="Label" hint="endpoint: must not be empty" />);

    const user = userEvent.setup();
    await user.hover(screen.getByRole('button', { name: StatusBadgeI18nKey.Details }));

    expect(await screen.findByText('endpoint: must not be empty')).toBeInTheDocument();
  });

  test('Should show the hint when the info icon is focused by keyboard', async () => {
    render(<StatusBadge tone={StatusBadgeTone.Error} label="Label" hint="endpoint: must not be empty" />);

    const user = userEvent.setup();
    await user.tab();

    expect(screen.getByRole('button', { name: StatusBadgeI18nKey.Details })).toHaveFocus();
    expect(await screen.findByText('endpoint: must not be empty')).toBeInTheDocument();
  });

  test('Should render the trailing element outside the pill, after the hint icon', () => {
    render(
      <StatusBadge
        tone={StatusBadgeTone.Error}
        label="Label"
        hint="hint"
        trailing={<button type="button">trailing</button>}
      />,
    );

    const pill = screen.getByText('Label').parentElement as HTMLElement;
    const hintIcon = screen.getByRole('button', { name: StatusBadgeI18nKey.Details });
    const trailing = screen.getByRole('button', { name: 'trailing' });
    expect(pill).not.toContainElement(trailing);
    expect(pill.compareDocumentPosition(hintIcon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hintIcon.compareDocumentPosition(trailing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
