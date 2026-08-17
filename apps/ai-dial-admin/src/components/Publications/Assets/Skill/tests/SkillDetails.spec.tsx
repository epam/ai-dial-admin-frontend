import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { PublicationsI18nKey } from '@/src/constants/i18n';
import { SkillPublication } from '@/src/models/dial/publications';
import SkillDetails from '../SkillDetails';

let capturedGridProps: { rowData?: unknown[] } = {};

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { rowData?: unknown[] }) => {
    capturedGridProps = props;
    return <section aria-label="skill-files" />;
  },
}));

const buildPublication = (overrides: Partial<SkillPublication['skillResources']>[0] = {}): SkillPublication =>
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
        skillResource: {
          name: 'my-skill',
          description: 'Does a thing',
          version: '1',
          path: 'review/my-skill',
          files: [{ name: 'SKILL.md', size: 128 }],
          ...overrides,
        },
      },
    ],
  }) as unknown as SkillPublication;

describe('Publications :: SkillDetails', () => {
  test('renders the skill name, description, and version', () => {
    render(<SkillDetails publication={buildPublication()} />);

    expect(screen.getByText('my-skill')).toBeInTheDocument();
    expect(screen.getByText('Does a thing')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('omits description and version labels when absent', () => {
    render(<SkillDetails publication={buildPublication({ description: undefined, version: undefined })} />);

    expect(screen.queryByText('Does a thing')).not.toBeInTheDocument();
  });

  test('renders the file list title with the file count', () => {
    render(<SkillDetails publication={buildPublication()} />);

    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 1`)).toBeInTheDocument();
  });

  test('passes the skill files to the grid, with no action column', () => {
    render(<SkillDetails publication={buildPublication()} />);

    expect(capturedGridProps.rowData).toEqual([{ name: 'SKILL.md', size: 128 }]);
    expect(screen.queryByRole('button', { name: /download|remove|open/i })).not.toBeInTheDocument();
  });

  test('renders nothing when the publication has no skill resource', () => {
    const publication = { skillResources: [] } as unknown as SkillPublication;
    const { container } = render(<SkillDetails publication={publication} />);

    expect(container).toBeEmptyDOMElement();
  });
});
