import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import FileNameCellRenderer from '../FileNameCellRenderer';

vi.mock('@/src/utils/files/icon', () => ({
  getIcon: (ext: string) => (ext === 'pdf' ? <span>pdf-icon</span> : null),
}));

describe('FileNameCellRenderer', () => {
  test('renders icon and name if icon exists', () => {
    const params = { data: { extension: 'pdf', name: 'file.pdf' } } as any;
    render(<FileNameCellRenderer {...params} />);
    expect(screen.getByText('pdf-icon')).toBeInTheDocument();
    expect(screen.getByText('file.pdf')).toBeInTheDocument();
  });

  test('renders only name if icon does not exist', () => {
    const params = { data: { extension: 'txt', name: 'file.txt' } } as any;
    render(<FileNameCellRenderer {...params} />);
    expect(screen.queryByText('pdf-icon')).toBeNull();
    expect(screen.getByText('file.txt')).toBeInTheDocument();
  });
});
