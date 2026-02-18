import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { DialPrompt } from '@/src/models/dial/prompt';
import PromptDetails from '../PromptDetails';

vi.mock('@/src/components/Assets/Prompts/View/Properties', () => ({
  default: ({ prompt, onChangePrompt, isPublication }: any) => (
    <div data-testid="prompt-properties">
      <div>Prompt Name: {prompt.name}</div>
      <div>Is Publication: {isPublication?.toString()}</div>
      <button onClick={() => onChangePrompt({ ...prompt, content: 'Modified content' })}>
        Change Prompt Properties
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/Common/Accordion/Accordion', () => ({
  default: ({ header, children, contentClassName }: any) => (
    <div data-testid="accordion" className={contentClassName}>
      <div data-testid="accordion-header">{header}</div>
      <div data-testid="accordion-content">{children}</div>
    </div>
  ),
}));

vi.mock('@/src/components/Common/EditableTitle/EditableTitle', () => ({
  default: ({ title, changeTitle, disabled, size }: any) => (
    <div data-testid="editable-title">
      <input
        data-testid="title-input"
        value={title}
        onChange={(e) => changeTitle(e.target.value)}
        disabled={disabled}
        aria-label={`Title size ${size}`}
      />
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNeutralButton: ({ label, onClick, iconBefore }: any) => (
    <button data-testid="delete-button" onClick={onClick}>
      {iconBefore}
      {label}
    </button>
  ),
}));

vi.mock('@tabler/icons-react', () => ({
  IconTrashX: (props: any) => <span data-testid="trash-icon" {...props} />,
}));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
}));

const mockPrompt: DialPrompt = {
  name: 'Test Prompt',
  content: 'Test content',
  version: '1.0',
  type: 'prompt',
  folderId: 'folder1',
  id: 'prompt1',
};

const setup = (props: Partial<{ prompt: DialPrompt; onChange: any; onRemove: any }> = {}) => {
  const onChange = props.onChange || vi.fn();
  const onRemove = props.onRemove || vi.fn();
  const prompt = props.prompt || mockPrompt;

  const utils = render(<PromptDetails prompt={prompt} onChange={onChange} onRemove={onRemove} />);

  return { onChange, onRemove, ...utils };
};

describe('Publications :: PromptDetails', () => {
  test('renders prompt details with accordion and prompt properties', () => {
    setup();

    expect(screen.getByTestId('accordion')).toBeInTheDocument();
    expect(screen.getByTestId('accordion-header')).toBeInTheDocument();
    expect(screen.getByTestId('accordion-content')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-properties')).toBeInTheDocument();
  });

  test('renders editable title with prompt name', () => {
    setup({ prompt: { ...mockPrompt, name: 'My Custom Prompt' } });

    const titleInput = screen.getByTestId('title-input');
    expect(titleInput).toHaveValue('My Custom Prompt');
  });

  test('renders delete button with trash icon', () => {
    setup();

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  test('calls onChange when prompt name is changed', async () => {
    const { onChange } = setup();

    const titleInput = screen.getByTestId('title-input');

    await userEvent.type(titleInput, 'X');

    expect(onChange).toHaveBeenCalled();

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0]).toHaveProperty('name');
    expect(lastCall[0]).toHaveProperty('content');
    expect(lastCall[0]).toHaveProperty('version');
  });

  test('calls onRemove when delete button is clicked', async () => {
    const { onRemove } = setup();

    const deleteButton = screen.getByTestId('delete-button');
    await userEvent.click(deleteButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test('passes isPublication prop to PromptProperties', () => {
    setup();

    expect(screen.getByText('Is Publication: true')).toBeInTheDocument();
  });

  test('calls onChange when prompt properties are modified', async () => {
    const { onChange } = setup();

    const changePropertiesButton = screen.getByText('Change Prompt Properties');
    await userEvent.click(changePropertiesButton);

    expect(onChange).toHaveBeenCalledWith({
      ...mockPrompt,
      content: 'Modified content',
    });
  });

  test('renders with empty prompt name', () => {
    setup({ prompt: { ...mockPrompt, name: '' } });

    const titleInput = screen.getByTestId('title-input');
    expect(titleInput).toHaveValue('');
  });

  test('applies correct contentClassName to accordion', () => {
    setup();

    const accordion = screen.getByTestId('accordion');
    expect(accordion).toHaveClass('h-full justify-between');
  });

  test('title is not disabled in collapsed state', () => {
    setup();

    const titleInput = screen.getByTestId('title-input');
    expect(titleInput).not.toBeDisabled();
  });

  test('renders with different prompt versions', () => {
    const promptWithVersion = { ...mockPrompt, version: '2.5' };
    setup({ prompt: promptWithVersion });

    expect(screen.getByTestId('prompt-properties')).toBeInTheDocument();
    expect(screen.getByText('Prompt Name: Test Prompt')).toBeInTheDocument();
  });
});
