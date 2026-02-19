import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import FilesProperties from '../FilesProperties';

describe('FilesProperties', () => {
  test('renders files list title and files', () => {
    const publication = {
      files: [{ file: { name: 'file1.txt' } }, { file: { name: 'file2.txt' } }],
      action: 'download',
    };

    render(<FilesProperties publication={publication} />);

    expect(screen.getByText(PublicationsI18nKey.FilesListTitle)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders files list title with empty files', () => {
    const publication = {
      files: [],
      action: 'none',
    };

    render(<FilesProperties publication={publication} />);
    expect(screen.getByText(PublicationsI18nKey.FilesListTitle)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoFiles)).toBeInTheDocument();
  });
});
