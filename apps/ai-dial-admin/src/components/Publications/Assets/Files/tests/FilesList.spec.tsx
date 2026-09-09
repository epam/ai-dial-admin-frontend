import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import FilesList from '../FilesList';
import { ActionType, PublicationFile } from '@/src/models/dial/publications';

describe('FilesList', () => {
  test('renders grid with files', () => {
    const files: PublicationFile[] = [
      {
        file: { name: 'file1.txt', path: '/path/file1.txt', extension: 'txt' },
        sourceUrl: 'files/source/file1.txt',
        targetUrl: 'files/public/file1.txt',
        reviewUrl: 'files/review/file1.txt',
        action: ActionType.DELETE,
      },
      {
        file: { name: 'file2.pdf', path: '/path/file2.pdf', extension: 'pdf' },
        sourceUrl: 'files/source/file2.pdf',
        targetUrl: 'files/public/file2.pdf',
        reviewUrl: 'files/review/file2.pdf',
        action: ActionType.DELETE,
      },
    ];

    render(<FilesList files={files} action={ActionType.DELETE} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
