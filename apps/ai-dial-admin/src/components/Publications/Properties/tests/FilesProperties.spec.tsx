import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import FilesProperties from '../FilesProperties';

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (k: string) => k,
}));

describe('FilesProperties', () => {
  test('renders files list title and files', () => {
    const publication = {
      files: [{ name: 'file1.txt' }, { name: 'file2.txt' }],
      action: 'download',
    };

    render(<FilesProperties publication={publication} />);

    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 2`)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders files list title with empty files', () => {
    const publication = {
      files: [],
      action: 'none',
    };

    render(<FilesProperties publication={publication} />);
    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 0`)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoFiles)).toBeInTheDocument();
  });
});
