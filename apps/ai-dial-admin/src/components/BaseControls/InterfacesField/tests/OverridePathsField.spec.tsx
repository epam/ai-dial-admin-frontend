import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

const { saveValidationDispatch } = vi.hoisted(() => ({ saveValidationDispatch: vi.fn() }));

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: saveValidationDispatch, resetCounter: 0 }),
  ValidationActionType: {
    SetField: 'SET_FIELD_VALIDATION',
    RemoveField: 'REMOVE_FIELD_VALIDATION',
  },
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialSelectField: ({ id, options, onChange, placeholder }: any) => (
      <select aria-label={placeholder ?? id} onChange={(e) => onChange(e.target.value)} defaultValue="">
        <option value="" disabled>
          {placeholder}
        </option>
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

import OverridePathsField from '@/src/components/BaseControls/InterfacesField/OverridePathsField';
import { ButtonsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

type Paths = Record<string, string>;

const Controlled = ({
  type,
  initial,
  disabled,
  onChangeSpy,
}: {
  type: DeploymentInterfaceType;
  initial?: Paths;
  disabled?: boolean;
  onChangeSpy?: (value?: Paths) => void;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <OverridePathsField
      fieldId="row"
      type={type}
      value={value}
      disabled={disabled}
      onChange={(next) => {
        onChangeSpy?.(next);
        setValue(next);
      }}
    />
  );
};

const getInput = (key: string) => document.getElementById(`row-override-${key}`) as HTMLInputElement | null;
const getAddButton = () => screen.queryByRole('button', { name: ButtonsI18nKey.AddOverridePath });

describe('OverridePathsField', () => {
  test('shows no path input until one is added', () => {
    render(<Controlled type={DeploymentInterfaceType.OpenAIResponses} />);

    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(getAddButton()).toBeInTheDocument();
  });

  test('with a single available operation, Add shows its input directly without a dropdown', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<Controlled type={DeploymentInterfaceType.OpenAIChatCompletions} onChangeSpy={onChangeSpy} />);

    await user.click(getAddButton()!);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(getInput('postAzureOpenaiChatCompletions')).toBeInTheDocument();
    expect(getAddButton()).not.toBeInTheDocument();
  });

  test('adding an empty row does not put anything into the entity value', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<Controlled type={DeploymentInterfaceType.OpenAIChatCompletions} onChangeSpy={onChangeSpy} />);

    await user.click(getAddButton()!);

    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  test('with several available operations, Add opens a dropdown listing only the unused ones', async () => {
    const user = userEvent.setup();
    render(<Controlled type={DeploymentInterfaceType.OpenAIResponses} initial={{ postOpenaiResponses: '/v1' }} />);

    await user.click(getAddButton()!);

    const optionValues = Array.from(screen.getByRole('combobox').querySelectorAll('option'))
      .map((o) => o.getAttribute('value'))
      .filter(Boolean);
    expect(optionValues).toEqual(['getOpenaiResponsesById', 'deleteOpenaiResponsesById', 'postOpenaiResponsesCancel']);
  });

  test('selecting an operation adds its input and hides the dropdown', async () => {
    const user = userEvent.setup();
    render(<Controlled type={DeploymentInterfaceType.AnthropicMessages} />);

    await user.click(getAddButton()!);
    await user.selectOptions(screen.getByRole('combobox'), 'postAnthropicMessagesCountTokens');

    expect(getInput('postAnthropicMessagesCountTokens')).toBeInTheDocument();
    expect(getInput('postAnthropicMessages')).toBeNull();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  test('only operations of the interface type are offered', async () => {
    const user = userEvent.setup();
    render(<Controlled type={DeploymentInterfaceType.OpenAIEmbeddings} />);

    await user.click(getAddButton()!);

    expect(getInput('postAzureOpenaiEmbeddings')).toBeInTheDocument();
    expect(getInput('postAzureOpenaiChatCompletions')).toBeNull();
  });

  test('typing into an added row stores the path under its operation key', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<Controlled type={DeploymentInterfaceType.OpenAIChatCompletions} onChangeSpy={onChangeSpy} />);

    await user.click(getAddButton()!);
    await user.type(getInput('postAzureOpenaiChatCompletions')!, '/v1');

    expect(onChangeSpy).toHaveBeenLastCalledWith({ postAzureOpenaiChatCompletions: '/v1' });
  });

  test('clearing an input removes the value but keeps the row on screen', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(
      <Controlled
        type={DeploymentInterfaceType.OpenAIChatCompletions}
        initial={{ postAzureOpenaiChatCompletions: '/v1' }}
        onChangeSpy={onChangeSpy}
      />,
    );

    await user.clear(getInput('postAzureOpenaiChatCompletions')!);

    expect(onChangeSpy).toHaveBeenLastCalledWith(undefined);
    expect(getInput('postAzureOpenaiChatCompletions')).toBeInTheDocument();
  });

  test('deleting a row removes it, offers it again, and yields undefined for the last one', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(
      <Controlled
        type={DeploymentInterfaceType.OpenAIChatCompletions}
        initial={{ postAzureOpenaiChatCompletions: '/v1' }}
        onChangeSpy={onChangeSpy}
      />,
    );

    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Delete} postAzureOpenaiChatCompletions` }));

    expect(onChangeSpy).toHaveBeenLastCalledWith(undefined);
    expect(getInput('postAzureOpenaiChatCompletions')).toBeNull();
    expect(getAddButton()).toBeInTheDocument();
  });

  test('deleting an empty added row removes it without touching the value', async () => {
    const user = userEvent.setup();
    render(<Controlled type={DeploymentInterfaceType.OpenAIChatCompletions} />);

    await user.click(getAddButton()!);
    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Delete} postAzureOpenaiChatCompletions` }));

    expect(getInput('postAzureOpenaiChatCompletions')).toBeNull();
    expect(getAddButton()).toBeInTheDocument();
  });

  test('keeps keys it has no input for when another row changes', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(
      <Controlled
        type={DeploymentInterfaceType.AnthropicMessages}
        initial={{ futureOperation: '/keep' }}
        onChangeSpy={onChangeSpy}
      />,
    );

    expect(screen.queryAllByRole('textbox')).toHaveLength(0);

    await user.click(getAddButton()!);
    await user.selectOptions(screen.getByRole('combobox'), 'postAnthropicMessages');
    await user.type(getInput('postAnthropicMessages')!, '/m');

    expect(onChangeSpy).toHaveBeenLastCalledWith({ futureOperation: '/keep', postAnthropicMessages: '/m' });
  });

  test('{id} on an operation without an id shows an error and marks the field invalid', () => {
    render(
      <Controlled
        type={DeploymentInterfaceType.OpenAIResponses}
        initial={{ postOpenaiResponses: '/v1/{id}/responses' }}
      />,
    );

    expect(screen.getByText(InterfacesI18nKey.OverridePathIdNotSupported)).toBeInTheDocument();
    expect(saveValidationDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'row-override-postOpenaiResponses',
      isValid: false,
    });
  });

  test('{id} on an operation with an id is valid', () => {
    saveValidationDispatch.mockClear();
    render(
      <Controlled
        type={DeploymentInterfaceType.OpenAIResponses}
        initial={{ getOpenaiResponsesById: '/v1/responses/{id}' }}
      />,
    );

    expect(screen.queryByText(InterfacesI18nKey.OverridePathIdNotSupported)).not.toBeInTheDocument();
    expect(saveValidationDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'row-override-getOpenaiResponsesById',
      isValid: true,
    });
  });

  test('read-only mode shows added rows without add or delete controls', () => {
    render(
      <Controlled
        type={DeploymentInterfaceType.OpenAIChatCompletions}
        initial={{ postAzureOpenaiChatCompletions: '/v1' }}
        disabled
      />,
    );

    expect(getInput('postAzureOpenaiChatCompletions')).toBeDisabled();
    expect(getAddButton()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Buttons.Delete/ })).not.toBeInTheDocument();
  });

  test('removes its validation fields on unmount', () => {
    const { unmount } = render(<Controlled type={DeploymentInterfaceType.OpenAIChatCompletions} />);
    saveValidationDispatch.mockClear();

    unmount();

    expect(saveValidationDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_FIELD_VALIDATION',
      field: 'row-override-postAzureOpenaiChatCompletions',
    });
  });
});
