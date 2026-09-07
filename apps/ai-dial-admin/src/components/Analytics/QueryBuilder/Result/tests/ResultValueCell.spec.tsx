import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ICellRendererParams } from 'ag-grid-community';

import ResultValueCell from '@/src/components/Analytics/QueryBuilder/Result/ResultValueCell';
import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';

const renderCellFor = (value: unknown, headerName = 'Request body') =>
  render(
    <ResultValueCell
      {...({ value, valueFormatted: renderCell(value), colDef: { headerName } } as ICellRendererParams)}
    />,
  );

const viewLabel = `${QueryBuilderI18nKey.ViewFullValue} Request body`;

const openViewer = async (value: unknown) => {
  const user = userEvent.setup();
  renderCellFor(value);
  await user.click(screen.getByRole('button', { name: viewLabel }));
  return { user, dialog: screen.getByRole('dialog', { name: 'Request body' }) };
};

describe('ResultValueCell', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders a short value as plain text, with nothing to open', () => {
    renderCellFor('gpt-4o');

    expect(screen.getByText('gpt-4o')).toBeTruthy();
    expect(screen.queryByRole('button', { name: viewLabel })).toBeNull();
  });

  test('offers a named control for a value too long to read in the cell', () => {
    renderCellFor({ messages: Array.from({ length: 60 }, (_, i) => ({ role: 'user', content: `turn ${i}` })) });

    expect(screen.getByRole('button', { name: viewLabel })).toBeTruthy();
  });

  test('opens the value in a dialog named by its column', async () => {
    const user = userEvent.setup();
    renderCellFor({ model: 'gpt-4o', prompt: 'x'.repeat(400) });

    await user.click(screen.getByRole('button', { name: viewLabel }));

    expect(screen.getByRole('dialog', { name: 'Request body' })).toBeTruthy();
  });

  // A request body reaches the grid as JSON text, not as an object.
  test('shows a JSON string indented rather than as one line', async () => {
    const user = userEvent.setup();
    const body = JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'x'.repeat(300) }] });
    renderCellFor(body);

    await user.click(screen.getByRole('button', { name: viewLabel }));

    const dialog = screen.getByRole('dialog', { name: 'Request body' });
    // Matched on raw text: the default matcher collapses the very whitespace under test.
    expect(
      within(dialog).getByText((_, element) => element?.textContent?.includes('\n  "model": "gpt-4o"') === true, {
        selector: 'pre',
      }),
    ).toBeTruthy();
  });

  test('offers copy and close side by side in the footer', async () => {
    const { dialog } = await openViewer('x'.repeat(500));

    expect(within(dialog).getByRole('button', { name: QueryBuilderI18nKey.CopyValue })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: ButtonsI18nKey.Close })).toBeTruthy();
  });

  test('copies the value as it is shown, not as it was stored', async () => {
    const body = JSON.stringify({ model: 'gpt-4o', prompt: 'x'.repeat(300) });
    const { user, dialog } = await openViewer(body);
    // Spied after userEvent.setup(), which installs a clipboard of its own over any earlier stub.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    await user.click(within(dialog).getByRole('button', { name: QueryBuilderI18nKey.CopyValue }));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(JSON.parse(body), null, 2));
  });

  test('closes from the footer', async () => {
    const user = userEvent.setup();
    renderCellFor('x'.repeat(500));

    await user.click(screen.getByRole('button', { name: viewLabel }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
