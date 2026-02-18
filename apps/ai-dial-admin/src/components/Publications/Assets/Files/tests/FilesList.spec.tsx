import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import FilesList from '../FilesList';

describe('FilesList', () => {
  test('renders grid with files', () => {
    const files = [
      { file: { name: 'file1.txt', path: '/path/file1.txt', extension: 'txt' } },
      { file: { name: 'file2.pdf', path: '/path/file2.pdf', extension: 'pdf' } },
    ];

    render(<FilesList files={files} action="download" />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
