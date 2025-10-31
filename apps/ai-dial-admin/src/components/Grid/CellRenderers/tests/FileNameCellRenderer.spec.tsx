import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import FileNameCellRenderer from '../FileNameCellRenderer';

describe('FileNameCellRenderer', () => {
  test('renders icon and name if icon exists', () => {
    const params = { data: { extension: 'pdf', name: 'file.pdf' } } as any;
    render(<FileNameCellRenderer {...params} />);
    expect(screen.getByText('file.pdf')).toBeInTheDocument();
  });

  test('renders only name if icon does not exist', () => {
    const params = { data: { extension: 'txt', name: 'file.txt' } } as any;
    render(<FileNameCellRenderer {...params} />);
    expect(screen.getByText('file.txt')).toBeInTheDocument();
  });
});
