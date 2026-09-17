import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import PromptProperties from '../PromptProperties';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { ActionType, PromptPublication, PublicationPrompt, PublicationStatus } from '@/src/models/dial/publications';

vi.mock('@/src/context/assets/FileFolderContext', () => ({
  useFileFolder: vi.fn(),
  FileFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../BaseProperties', () => ({
  default: () => (
    <div role="region" aria-label="base-properties">
      Base Properties
    </div>
  ),
}));

vi.mock('@/src/components/Publications/Assets/Prompt/PromptsList', () => ({
  default: ({ publication }: { publication: any }) => (
    <div role="region" aria-label="prompts-list">
      <span>Prompts: {publication.prompts?.length || 0}</span>
    </div>
  ),
}));

// The mocked list reads the prompts only; the factory carries the rest of a publication's required members.
const publicationPrompt = (name: string): PublicationPrompt => ({
  prompt: { name },
  sourceUrl: `prompts/my-bucket/${name}`,
  targetUrl: `prompts/public/${name}`,
  reviewUrl: `prompts/review/${name}`,
  action: ActionType.ADD,
});

const promptPublication = (prompts: PublicationPrompt[]): PromptPublication => ({
  path: 'public/folder',
  requestName: 'request',
  author: 'author',
  createdAt: '0',
  status: PublicationStatus.PENDING,
  action: ActionType.ADD,
  folderId: 'public',
  prompts,
});

describe('PromptProperties', () => {
  const mockFetchFiles = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useFileFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
      files: [{}],
    });
  });

  test('renders BaseProperties and PromptsList components', () => {
    const publication = promptPublication([publicationPrompt('prompt1'), publicationPrompt('prompt2')]);

    render(<PromptProperties publication={publication} onChange={mockOnChange} />);

    expect(screen.getByRole('region', { name: 'base-properties' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'prompts-list' })).toBeInTheDocument();
    expect(screen.getByText('Prompts: 2')).toBeInTheDocument();
  });

  test('renders with empty prompts array', () => {
    const publication = promptPublication([]);

    render(<PromptProperties publication={publication} onChange={mockOnChange} />);

    expect(screen.getByRole('region', { name: 'base-properties' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'prompts-list' })).toBeInTheDocument();
    expect(screen.getByText('Prompts: 0')).toBeInTheDocument();
  });

  test('does not call fetchFiles on mount when files array is not empty', () => {
    const publication = promptPublication([]);

    render(<PromptProperties publication={publication} onChange={mockOnChange} />);

    expect(mockFetchFiles).not.toHaveBeenCalled();
  });
});
