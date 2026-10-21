import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { APPLICATION_ZIP_TYPES } from '@/src/constants/request-headers';
import SelectedFile from '../SelectedFile';

describe('SelectedFile', () => {
  test('renders the selected file name', () => {
    const file = new File(['content'], 'dataset_export.csv', { type: 'text/csv' });
    render(<SelectedFile file={file} onChangeFile={vi.fn()} />);

    expect(screen.getByText('dataset_export.csv')).toBeTruthy();
  });

  test('accepts both CSV and ZIP files on the Change input', () => {
    const file = new File(['content'], 'dataset_export.csv', { type: 'text/csv' });
    render(<SelectedFile file={file} onChangeFile={vi.fn()} />);

    const input = document.getElementById('file') as HTMLInputElement;
    expect(input.accept).toContain('text/csv');
    APPLICATION_ZIP_TYPES.forEach((type) => expect(input.accept).toContain(type));
  });

  test('shows the CSV file icon for a .csv file', () => {
    const file = new File(['content'], 'dataset_export.csv', { type: 'text/csv' });
    render(<SelectedFile file={file} onChangeFile={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'CSV file icon' })).toBeTruthy();
  });

  test('shows the ZIP file icon for a .zip file, not the CSV icon', () => {
    const file = new File(['content'], 'dataset_export.zip', { type: 'application/zip' });
    render(<SelectedFile file={file} onChangeFile={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'ZIP file icon' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'CSV file icon' })).not.toBeInTheDocument();
  });
});
