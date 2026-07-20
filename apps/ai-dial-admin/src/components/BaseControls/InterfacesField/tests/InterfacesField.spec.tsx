import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import { ErrorI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

type Entity = { interfaces?: Record<string, { baseUrl?: string }> };

const ControlledInterfacesField = ({ initialEntity }: { initialEntity: Entity }) => {
  const [entity, setEntity] = useState(initialEntity);
  return <InterfacesField entity={entity} onChangeEntity={setEntity} allowedTypes={SINGLE_TYPE} />;
};

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

const MULTI_TYPES = [
  DeploymentInterfaceType.OpenAIChatCompletions,
  DeploymentInterfaceType.OpenAIResponses,
  DeploymentInterfaceType.AnthropicMessages,
];

const SINGLE_TYPE = [DeploymentInterfaceType.OpenAIChatCompletions];

describe('InterfacesField', () => {
  test('single allowed type: clicking Add creates the input directly, no dropdown', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(<InterfacesField entity={{ interfaces: {} }} onChangeEntity={onChangeEntity} allowedTypes={SINGLE_TYPE} />);

    await user.click(screen.getByRole('button', { name: 'Buttons.Add' }));

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(onChangeEntity).toHaveBeenCalledWith({
      interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } },
    });
  });

  test('single allowed type: add button hides once the type is configured', () => {
    render(
      <InterfacesField
        entity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } } }}
        onChangeEntity={vi.fn()}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Buttons.Add' })).not.toBeInTheDocument();
  });

  test('multiple allowed types: Add opens a dropdown listing only unused types', async () => {
    const user = userEvent.setup();
    render(
      <InterfacesField
        entity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'https://x' } } }}
        onChangeEntity={vi.fn()}
        allowedTypes={MULTI_TYPES}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.Add' }));

    const select = screen.getByRole('combobox');
    const optionValues = Array.from(select.querySelectorAll('option'))
      .map((o) => o.getAttribute('value'))
      .filter(Boolean);

    expect(optionValues).toEqual([DeploymentInterfaceType.OpenAIResponses, DeploymentInterfaceType.AnthropicMessages]);
  });

  test('multiple allowed types: selecting a type from the dropdown reveals its input and hides the dropdown', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(<InterfacesField entity={{ interfaces: {} }} onChangeEntity={onChangeEntity} allowedTypes={MULTI_TYPES} />);

    await user.click(screen.getByRole('button', { name: 'Buttons.Add' }));
    await user.selectOptions(screen.getByRole('combobox'), DeploymentInterfaceType.AnthropicMessages);

    expect(onChangeEntity).toHaveBeenCalledWith({
      interfaces: { [DeploymentInterfaceType.AnthropicMessages]: { baseUrl: '' } },
    });
  });

  test('multiple allowed types: add button hides once all types are configured', () => {
    render(
      <InterfacesField
        entity={{
          interfaces: {
            [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'a' },
            [DeploymentInterfaceType.OpenAIResponses]: { baseUrl: 'b' },
            [DeploymentInterfaceType.AnthropicMessages]: { baseUrl: 'c' },
          },
        }}
        onChangeEntity={vi.fn()}
        allowedTypes={MULTI_TYPES}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Buttons.Add' })).not.toBeInTheDocument();
  });

  test('deleting a row removes it and restores add availability', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(
      <InterfacesField
        entity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'https://x' } } }}
        onChangeEntity={onChangeEntity}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

    expect(onChangeEntity).toHaveBeenCalledWith({ interfaces: {} });
  });

  test('editing an input value calls onChangeEntity with the entity-backed camelCase baseUrl field', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(
      <InterfacesField
        entity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } } }}
        onChangeEntity={onChangeEntity}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    const input = screen.getByRole('textbox', { name: InterfacesI18nKey.OpenAIChatCompletions });
    await user.type(input, 'x');

    expect(onChangeEntity).toHaveBeenCalledWith({
      interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'x' } },
    });
  });

  test('editing an input value calls onChangeEntity with the core-backed snake_case base_url field when isAsset', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(
      <InterfacesField
        entity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '' } } }}
        onChangeEntity={onChangeEntity}
        allowedTypes={SINGLE_TYPE}
        isAsset
      />,
    );

    const input = screen.getByRole('textbox', { name: InterfacesI18nKey.OpenAIChatCompletions });
    await user.type(input, 'x');

    expect(onChangeEntity).toHaveBeenCalledWith({
      interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: 'x' } },
    });
  });

  test('shows a URL validation error for an invalid non-empty value and clears it once valid', async () => {
    const user = userEvent.setup();
    render(
      <ControlledInterfacesField
        initialEntity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } } }}
      />,
    );

    const input = screen.getByRole('textbox', { name: InterfacesI18nKey.OpenAIChatCompletions });
    await user.type(input, 'not-a-url');

    expect(screen.getByText(ErrorI18nKey.UrlField)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'https://example.com');

    expect(screen.queryByText(ErrorI18nKey.UrlField)).not.toBeInTheDocument();
  });

  test('does not show a validation error for a blank value', () => {
    render(
      <InterfacesField
        entity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } } }}
        onChangeEntity={vi.fn()}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    expect(screen.queryByText(ErrorI18nKey.UrlField)).not.toBeInTheDocument();
    expect(screen.queryByText(ErrorI18nKey.RequiredField)).not.toBeInTheDocument();
  });

  test('add button is wrapped in its own container so it does not stretch full width', () => {
    render(<InterfacesField entity={{ interfaces: {} }} onChangeEntity={vi.fn()} allowedTypes={SINGLE_TYPE} />);

    const addButton = screen.getByRole('button', { name: 'Buttons.Add' });
    expect(addButton.parentElement?.tagName).toBe('DIV');
    expect(addButton.parentElement?.children).toHaveLength(1);
  });

  test('disabled: hides add/delete controls and disables inputs', () => {
    render(
      <InterfacesField
        entity={{ interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'https://x' } } }}
        onChangeEntity={vi.fn()}
        allowedTypes={SINGLE_TYPE}
        disabled
      />,
    );

    expect(screen.queryByRole('button', { name: 'Buttons.Add' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buttons.Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: InterfacesI18nKey.OpenAIChatCompletions })).toBeDisabled();
  });
});
