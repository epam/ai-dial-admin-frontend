import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { DialPrompt } from '@/src/models/dial/prompt';
import { PromptPublication, PublicationPrompt } from '@/src/models/dial/publications';
import PromptsList from '../PromptsList';

vi.mock('@/src/utils/files/path', () => ({
  updatePathWithNameAndVersion: vi
    .fn()
    .mockImplementation((oldPath: string, name: string, version: string) => `updated/${name}/${version}.json`),
}));

vi.mock('../PromptDetails', () => ({
  default: ({ prompt, onChange, onRemove }: any) => (
    <div data-testid={`prompt-details-${prompt.id || 'unknown'}`}>
      <div>Prompt: {prompt.name}</div>
      <button data-testid={`change-${prompt.id}`} onClick={() => onChange({ ...prompt, name: 'Updated Prompt' })}>
        Change Prompt
      </button>
      <button data-testid={`remove-${prompt.id}`} onClick={onRemove}>
        Remove Prompt
      </button>
    </div>
  ),
}));

const mockPrompts: PublicationPrompt[] = [
  {
    prompt: {
      id: 'prompt1',
      name: 'First Prompt',
      content: 'First content',
      version: '1.0.0',
      type: 'prompt',
      folderId: 'folder1',
      path: 'publications/prompts/first/1.0.0.json',
    },
  },
  {
    prompt: {
      id: 'prompt2',
      name: 'Second Prompt',
      content: 'Second content',
      version: '2.0.0',
      type: 'prompt',
      folderId: 'folder1',
      path: 'publications/prompts/second/2.0.0.json',
    },
  },
  {
    prompt: {
      id: 'prompt3',
      name: 'Third Prompt',
      content: 'Third content',
      version: '1.5.0',
      type: 'prompt',
      folderId: 'folder1',
      path: 'publications/prompts/third/1.5.0.json',
    },
  },
];

const createMockPublication = (prompts?: PublicationPrompt[]): PromptPublication => ({
  path: 'publications/test-publication',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-01',s
  status: 'pending',
  action: 'add' as any,
  folderId: 'folder1',
  prompts: prompts || mockPrompts,
});

const setup = (props: Partial<{ publication: PromptPublication; onChange: any }> = {}) => {
  const onChange = props.onChange || vi.fn();
  const publication = props.publication || createMockPublication();

  const utils = render(<PromptsList publication={publication} onChange={onChange} />);

  return { onChange, publication, ...utils };
};

describe('Publications :: PromptsList', () => {
  test('renders list of prompts', () => {
    setup();

    expect(screen.getByTestId('prompt-details-prompt1')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-details-prompt2')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-details-prompt3')).toBeInTheDocument();

    expect(screen.getByText('Prompt: First Prompt')).toBeInTheDocument();
    expect(screen.getByText('Prompt: Second Prompt')).toBeInTheDocument();
    expect(screen.getByText('Prompt: Third Prompt')).toBeInTheDocument();
  });

  test('renders empty list when no prompts', () => {
    const publication = createMockPublication([]);
    const { container } = setup({ publication });

    const listContainer = container.querySelector('.flex-1.min-h-0.relative.overflow-auto');
    expect(listContainer).toBeInTheDocument();
    expect(listContainer?.children).toHaveLength(0);
  });

  test('renders list when prompts is undefined', () => {
    const publication = createMockPublication();
    delete publication.prompts;
    const { container } = setup({ publication });

    const listContainer = container.querySelector('.flex-1.min-h-0.relative.overflow-auto');
    expect(listContainer).toBeInTheDocument();
    expect(listContainer?.children).toHaveLength(0);
  });

  test('calls onChange when a prompt is updated', async () => {
    const { onChange } = setup();

    const changeButton = screen.getByTestId('change-prompt1');
    await userEvent.click(changeButton);

    expect(onChange).toHaveBeenCalledTimes(1);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts).toHaveLength(3);
    expect(updatedPublication.prompts[0].prompt.name).toBe('Updated Prompt');
  });

  test('updates path when prompt name or version changes', async () => {
    const { onChange } = setup();
    const { updatePathWithNameAndVersion } = await import('@/src/utils/files/path');

    const changeButton = screen.getByTestId('change-prompt1');
    await userEvent.click(changeButton);

    expect(updatePathWithNameAndVersion).toHaveBeenCalledWith(
      'publications/prompts/first/1.0.0.json',
      'Updated Prompt',
      '1.0.0',
    );

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts[0].prompt.path).toBe('updated/Updated Prompt/1.0.0.json');
  });

  test('preserves other prompts when updating one prompt', async () => {
    const { onChange } = setup();

    const changeButton = screen.getByTestId('change-prompt2');
    await userEvent.click(changeButton);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts[0].prompt.name).toBe('First Prompt');
    expect(updatedPublication.prompts[1].prompt.name).toBe('Updated Prompt');
    expect(updatedPublication.prompts[2].prompt.name).toBe('Third Prompt');
  });

  test('removes prompt when onRemove is called', async () => {
    const { onChange } = setup();

    const removeButton = screen.getByTestId('remove-prompt2');
    await userEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledTimes(1);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts).toHaveLength(2);
    expect(updatedPublication.prompts[0].prompt.id).toBe('prompt1');
    expect(updatedPublication.prompts[1].prompt.id).toBe('prompt3');
  });

  test('removes first prompt correctly', async () => {
    const { onChange } = setup();

    const removeButton = screen.getByTestId('remove-prompt1');
    await userEvent.click(removeButton);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts).toHaveLength(2);
    expect(updatedPublication.prompts[0].prompt.id).toBe('prompt2');
    expect(updatedPublication.prompts[1].prompt.id).toBe('prompt3');
  });

  test('removes last prompt correctly', async () => {
    const { onChange } = setup();

    const removeButton = screen.getByTestId('remove-prompt3');
    await userEvent.click(removeButton);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts).toHaveLength(2);
    expect(updatedPublication.prompts[0].prompt.id).toBe('prompt1');
    expect(updatedPublication.prompts[1].prompt.id).toBe('prompt2');
  });

  test('removes all prompts one by one', async () => {
    const { onChange, rerender } = setup();

    await userEvent.click(screen.getByTestId('remove-prompt1'));
    let updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts).toHaveLength(2);

    rerender(<PromptsList publication={updatedPublication} onChange={onChange} />);

    await userEvent.click(screen.getByTestId('remove-prompt2'));
    updatedPublication = onChange.mock.calls[1][0];
    expect(updatedPublication.prompts).toHaveLength(1);

    rerender(<PromptsList publication={updatedPublication} onChange={onChange} />);

    await userEvent.click(screen.getByTestId('remove-prompt3'));
    updatedPublication = onChange.mock.calls[2][0];
    expect(updatedPublication.prompts).toHaveLength(0);
  });

  test('preserves publication properties when updating prompts', async () => {
    const { onChange } = setup();

    const changeButton = screen.getByTestId('change-prompt1');
    await userEvent.click(changeButton);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.path).toBe('publications/test-publication');
    expect(updatedPublication.requestName).toBe('test-request');
    expect(updatedPublication.author).toBe('test@example.com');
    expect(updatedPublication.folderId).toBe('folder1');
  });

  test('handles prompt without path property', async () => {
    const promptsWithoutPath = [{ ...mockPrompts[0], prompt: { ...mockPrompts[0].prompt } }];
    delete (promptsWithoutPath[0].prompt as any).path;

    const publication = createMockPublication(promptsWithoutPath);
    const { onChange } = setup({ publication });

    const changeButton = screen.getByTestId('change-prompt1');
    await userEvent.click(changeButton);

    expect(onChange).toHaveBeenCalled();
    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.prompts[0].prompt.path).toBe('updated/Updated Prompt/1.0.0.json');
  });

  test('renders with single prompt', () => {
    const publication = createMockPublication([mockPrompts[0]]);
    setup({ publication });

    expect(screen.getByTestId('prompt-details-prompt1')).toBeInTheDocument();
    expect(screen.queryByTestId('prompt-details-prompt2')).not.toBeInTheDocument();
  });

  test('applies correct styling classes', () => {
    const { container } = setup();

    const listContainer = container.firstElementChild;
    expect(listContainer).toHaveClass('flex-1', 'min-h-0', 'relative', 'overflow-auto');

    const promptContainers = container.querySelectorAll('.mb-6');
    expect(promptContainers).toHaveLength(3);
  });

  test('does not call onChange if callback is not provided', async () => {
    const publication = createMockPublication();
    render(<PromptsList publication={publication} />);

    const changeButton = screen.getByTestId('change-prompt1');

    await expect(userEvent.click(changeButton)).resolves.not.toThrow();
  });

  test('handles prompts with partial data', () => {
    const partialPrompts: PublicationPrompt[] = [
      { prompt: { id: 'partial1', name: 'Partial Prompt' } as Partial<DialPrompt> } as PublicationPrompt,
      { prompt: { id: 'partial2', version: '1.0.0' } as Partial<DialPrompt> } as PublicationPrompt,
    ];

    const publication = createMockPublication(partialPrompts);
    setup({ publication });

    expect(screen.getByTestId('prompt-details-partial1')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-details-partial2')).toBeInTheDocument();
  });
});
