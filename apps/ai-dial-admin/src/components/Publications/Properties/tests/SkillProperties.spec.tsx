import { render, screen } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, test, vi } from 'vitest';

import { PublicationsI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { SkillPublication } from '@/src/models/dial/publications';
import SkillProperties from '../SkillProperties';

vi.mock('@/src/context/assets/FileFolderContext', () => ({
  useFileFolder: vi.fn(),
  FileFolderProvider: ({ children }: any) => <div>{children}</div>,
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
        skillResource: { name: 'my-skill', path: 'review/my-skill', files: [] },
      },
    ],
  }) as unknown as SkillPublication;

describe('SkillProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useFileFolder as Mock).mockReturnValue({ files: [{}], fetchFiles: vi.fn() });
  });

  test('renders the base properties fields and the skill details', () => {
    render(<SkillProperties publication={buildPublication()} />);

    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 0`)).toBeInTheDocument();
    expect(screen.getByText('my-skill')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'skill-files' })).toBeInTheDocument();
  });
});
