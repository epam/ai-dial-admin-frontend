import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import PromptProperties from '../PromptProperties';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';

vi.mock('../BaseProperties', () => ({
  default: () => <div data-testid="base-properties">Base Properties</div>,
}));

vi.mock('@/src/components/Publications/Assets/Prompt/PromptsList', () => ({
  default: ({ publication }: { publication: any }) => (
    <div data-testid="prompts-list">
      <span>Prompts: {publication.prompts?.length || 0}</span>
    </div>
  ),
}));

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
    const publication = {
      prompts: [{ name: 'prompt1' }, { name: 'prompt2' }],
      action: 'download',
    };

    render(<PromptProperties publication={publication} onChange={mockOnChange} />);

    expect(screen.getByTestId('base-properties')).toBeInTheDocument();
    expect(screen.getByTestId('prompts-list')).toBeInTheDocument();
    expect(screen.getByText('Prompts: 2')).toBeInTheDocument();
  });

  test('renders with empty prompts array', () => {
    const publication = {
      prompts: [],
      action: 'none',
    };

    render(<PromptProperties publication={publication} onChange={mockOnChange} />);

    expect(screen.getByTestId('base-properties')).toBeInTheDocument();
    expect(screen.getByTestId('prompts-list')).toBeInTheDocument();
    expect(screen.getByText('Prompts: 0')).toBeInTheDocument();
  });

  test('does not call fetchFiles on mount when files array is not empty', () => {
    const publication = {
      prompts: [],
      action: 'download',
    };

    render(<PromptProperties publication={publication} onChange={mockOnChange} />);

    expect(mockFetchFiles).not.toHaveBeenCalled();
  });
});
