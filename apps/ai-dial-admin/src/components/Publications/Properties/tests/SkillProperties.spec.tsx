import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mock, beforeEach, describe, expect, test, vi } from 'vitest';

import { PublicationsI18nKey } from '@/src/constants/i18n';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { SkillPublication } from '@/src/models/dial/publications';
import SkillProperties from '../SkillProperties';

vi.mock('@/src/context/assets/SkillFolderContext', () => ({
  useSkillFolder: vi.fn(),
  SkillFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => <section aria-label="skill-files" />,
}));

const buildPublication = (): SkillPublication =>
  ({
    path: 'publications/test',
    requestName: 'test-request',
    author: 'author@example.com',
    createdAt: '2024-01-01',
    status: 'pending',
    action: 'add',
    folderId: 'folder1',
    skillResources: [
      {
        sourceUrl: 'skills/src/my-skill',
        targetUrl: 'skills/public/my-skill',
        reviewUrl: 'skills/review/my-skill',
        action: 'add',
        skillResource: { name: 'my-skill', path: 'review/my-skill', folderId: 'review/', files: [] },
      },
    ],
  }) as unknown as SkillPublication;

describe('SkillProperties', () => {
  const setAddedFiles = vi.fn();
  const setRemovedFileNames = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSkillFolder as Mock).mockReturnValue({ files: [{}], fetchFiles: vi.fn() });
  });

  test('renders the base properties fields and the skill details', () => {
    render(
      <SkillProperties
        publication={buildPublication()}
        setAddedFiles={setAddedFiles}
        setRemovedFileNames={setRemovedFileNames}
      />,
    );

    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 0`)).toBeInTheDocument();
    expect(screen.getByText('my-skill')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'skill-files' })).toBeInTheDocument();
  });

  test('adding a file calls setAddedFiles with it appended', async () => {
    render(
      <SkillProperties
        publication={buildPublication()}
        setAddedFiles={setAddedFiles}
        setRemovedFileNames={setRemovedFileNames}
      />,
    );

    const input = screen.getByLabelText(/add/i, { selector: 'input' });
    const file = new File(['content'], 'notes.md');
    await userEvent.setup().upload(input, file);

    expect(setAddedFiles).toHaveBeenCalled();
    const updater = setAddedFiles.mock.calls[0][0];
    expect(updater([])).toEqual([file]);
  });
});
