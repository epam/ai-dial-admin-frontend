import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import TitleSubtitleCellRenderer, { TitleSubtitleCellRendererParams } from '../TitleSubtitleCellRenderer';

// The real `EllipsisTooltip` clips at the rendered width and exposes the full string as its
// `aria-label` only while clipped. jsdom reports every width as 0, so it would never clip there —
// the stub stands in for that behaviour, keeping the class it was given and always exposing the label.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  EllipsisTooltip: ({ text, className }: { text: string; className?: string }) => (
    <span className={className} aria-label={text}>
      {text}
    </span>
  ),
}));

interface Row {
  id: string;
}

const ROW: Row = { id: 'run-0001' };

const renderCell = (params: Partial<TitleSubtitleCellRendererParams<Row>>) =>
  render(<TitleSubtitleCellRenderer {...(params as TitleSubtitleCellRendererParams<Row>)} />);

describe('TitleSubtitleCellRenderer', () => {
  test('renders the column value on the first line and the resolved value on the second', () => {
    renderCell({ value: 'Nightly regression', data: ROW, getSubtitle: (data) => data?.id });

    expect(screen.getByText('Nightly regression')).toBeTruthy();
    expect(screen.getByText('run-0001')).toBeTruthy();
  });

  test('truncates each line independently rather than as one block of text', () => {
    const title = 'A run name long enough to be clipped by any realistic column width';
    renderCell({ value: title, data: ROW, getSubtitle: (data) => data?.id });

    const lines = screen.getAllByLabelText(/./);

    expect(lines).toHaveLength(2);
    expect(lines[0].contains(lines[1])).toBe(false);
  });

  test('exposes the full value of both lines even when they are clipped', () => {
    const title = 'A run name long enough to be clipped by any realistic column width';
    renderCell({ value: title, data: ROW, getSubtitle: () => 'a subtitle long enough to be clipped as well' });

    expect(screen.getByLabelText(title)).toBeTruthy();
    expect(screen.getByLabelText('a subtitle long enough to be clipped as well')).toBeTruthy();
  });

  test('emits no horizontal padding of its own, leaving the grid cell to supply it', () => {
    const { container } = renderCell({ value: 'Nightly regression', data: ROW, getSubtitle: (data) => data?.id });

    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper.className).not.toMatch(/(^|\s)-?(p|px|pl|pr)-/);
  });

  test('renders only the first line when the row resolves no subtitle', () => {
    renderCell({ value: 'Nightly regression', data: ROW });

    expect(screen.getAllByLabelText(/./)).toHaveLength(1);
  });

  test('renders nothing when neither line has a value', () => {
    const { container } = renderCell({ value: null, data: ROW, getSubtitle: () => undefined });

    expect(container.firstElementChild).toBeNull();
  });
});
