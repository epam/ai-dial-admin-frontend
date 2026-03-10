import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { DialPrompt } from '@/src/models/dial/prompt';
import PromptDetails from '../PromptDetails';
import { ButtonsI18nKey } from '../../../../../constants/i18n';

vi.mock('@/src/components/Assets/Prompts/View/Properties', () => ({
  default: ({ prompt, onChangePrompt, isPublication }: any) => (
    <div role="region" aria-label="prompt-properties">
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
    <div role="listbox" className={contentClassName}>
      <div>{header}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock('@/src/components/Common/EditableTitle/EditableTitle', () => ({
  default: ({ title, changeTitle, disabled, size }: any) => (
    <div role="region" aria-label="editable-title">
      <input aria-label="title-input" value={title} onChange={(e) => changeTitle(e.target.value)} disabled={disabled} />
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNeutralButton: ({ label, onClick, iconBefore }: any) => (
    <button role="button" aria-label={label} onClick={onClick}>
      {iconBefore}
      {label}
    </button>
  ),
}));

vi.mock('@tabler/icons-react', () => ({
  IconTrashX: (props: any) => <span role="img" aria-label="trash-icon" {...props} />,
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

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Prompt Name: Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Is Publication: true')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'prompt-properties' })).toBeInTheDocument();
  });

  test('renders editable title with prompt name', () => {
    setup({ prompt: { ...mockPrompt, name: 'My Custom Prompt' } });

    const titleInput = screen.getByRole('textbox', { name: 'title-input' });
    expect(titleInput).toHaveValue('My Custom Prompt');
  });

  test('renders delete button with trash icon', () => {
    setup();

    const deleteButton = screen.getByRole('button', { name: ButtonsI18nKey.Delete });
    expect(deleteButton).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'trash-icon' })).toBeInTheDocument();
  });

  test('calls onChange when prompt name is changed', async () => {
    const { onChange } = setup();

    const titleInput = screen.getByRole('textbox', { name: 'title-input' });

    await userEvent.type(titleInput, 'X');

    expect(onChange).toHaveBeenCalled();

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0]).toHaveProperty('name');
    expect(lastCall[0]).toHaveProperty('content');
    expect(lastCall[0]).toHaveProperty('version');
  });

  test('calls onRemove when delete button is clicked', async () => {
    const { onRemove } = setup();

    const deleteButton = screen.getByRole('button', { name: ButtonsI18nKey.Delete });
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

    const titleInput = screen.getByRole('textbox', { name: 'title-input' });
    expect(titleInput).toHaveValue('');
  });

  test('applies correct contentClassName to accordion', () => {
    setup();

    const accordion = screen.getByRole('listbox');
    expect(accordion).toHaveClass('h-full justify-between');
  });

  test('title is not disabled in collapsed state', () => {
    setup();

    const titleInput = screen.getByRole('textbox', { name: 'title-input' });
    expect(titleInput).not.toBeDisabled();
  });

  test('renders with different prompt versions', () => {
    const promptWithVersion = { ...mockPrompt, version: '2.5' };
    setup({ prompt: promptWithVersion });

    expect(screen.getByRole('region', { name: 'prompt-properties' })).toBeInTheDocument();
    expect(screen.getByText('Prompt Name: Test Prompt')).toBeInTheDocument();
  });
});
