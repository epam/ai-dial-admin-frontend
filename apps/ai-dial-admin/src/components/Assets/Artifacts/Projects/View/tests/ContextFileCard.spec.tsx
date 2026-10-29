import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ProjectI18nKey } from '@/src/constants/i18n';
import ContextFileCard from '../ContextFileCard';

describe('ContextFileCard', () => {
  test('shows the name without its extension and the extension with the size as the type', () => {
    render(<ContextFileCard name="report.final.pdf" size={1536} />);

    expect(screen.getByText('report.final')).toBeTruthy();
    expect(screen.getByText('PDF · 1.5 KB')).toBeTruthy();
  });

  test('shows only the extension when the size is unknown', () => {
    render(<ContextFileCard name="data.csv" />);

    expect(screen.getByText('data')).toBeTruthy();
    expect(screen.getByText('CSV')).toBeTruthy();
  });

  test('keeps the whole name and shows no type label for a file without an extension', () => {
    render(<ContextFileCard name="Makefile" size={10} />);

    expect(screen.getByText('Makefile')).toBeTruthy();
    expect(screen.getByText('10 B')).toBeTruthy();
  });

  test('keeps a dot-leading name whole', () => {
    render(<ContextFileCard name=".env" />);

    expect(screen.getByText('.env')).toBeTruthy();
  });

  test('renders only the actions it is given', () => {
    render(<ContextFileCard name="a.csv" />);

    expect(screen.queryByRole('button', { name: ProjectI18nKey.DownloadFile })).toBeNull();
    expect(screen.queryByRole('button', { name: ProjectI18nKey.RemoveFile })).toBeNull();
  });

  test('offers no preview action', () => {
    render(<ContextFileCard name="a.csv" onDownload={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('runs the matching handler for each action', async () => {
    const user = userEvent.setup();
    const handlers = { onDownload: vi.fn(), onRemove: vi.fn() };
    render(<ContextFileCard name="a.csv" {...handlers} />);

    await user.click(screen.getByRole('button', { name: ProjectI18nKey.DownloadFile }));
    await user.click(screen.getByRole('button', { name: ProjectI18nKey.RemoveFile }));

    expect(handlers.onDownload).toHaveBeenCalledOnce();
    expect(handlers.onRemove).toHaveBeenCalledOnce();
  });

  test('hides the remove action when disabled but keeps download', () => {
    render(<ContextFileCard name="a.csv" disabled onDownload={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.queryByRole('button', { name: ProjectI18nKey.RemoveFile })).toBeNull();
    expect(screen.getByRole('button', { name: ProjectI18nKey.DownloadFile })).toBeTruthy();
  });
});
