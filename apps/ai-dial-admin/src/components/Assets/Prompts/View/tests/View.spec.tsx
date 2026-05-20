import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { DialPrompt } from '@/src/models/dial/prompt';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import PromptView from '../View';

// Mock dependencies
vi.mock('@/src/context/assets/PromptFolderContext', () => ({
  usePromptFolder: vi.fn(),
}));

vi.mock('@/src/app/[lang]/prompts/actions', () => ({
  createPrompt: vi.fn(),
  getPrompts: vi.fn(),
  movePrompts: vi.fn(),
  removePrompt: vi.fn(),
  getPrompt: vi.fn(),
  exportPrompts: vi.fn(),
  bulkDeletePrompts: vi.fn(),
}));

describe('PromptView', () => {
  const mockFetchFiles = vi.fn();
  const mockOriginalPrompt: DialPrompt = {
    id: 'prompt-1',
    name: 'Test Prompt',
    version: '1.0.0',
    folderId: '/folder/',
    path: '/folder/prompt-1',
    content: 'Test content',
  } as DialPrompt;

  const mockEtag = 'etag-123';

  beforeEach(() => {
    vi.clearAllMocks();

    (usePromptFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
    });
  });

  describe('Component rendering and props', () => {
    test('should render with null prompts', () => {
      render(<PromptView originalPrompt={mockOriginalPrompt} etag={mockEtag} prompts={null} />);

      expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    });

    test('should render with empty prompts array', () => {
      render(<PromptView originalPrompt={mockOriginalPrompt} etag={mockEtag} prompts={[]} />);

      expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    });
  });
});
