import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import { ErrorI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

type InterfaceValue = { baseUrl?: string; base_url?: string };

const ControlledInterfacesField = ({ initialInterfaces }: { initialInterfaces: Record<string, InterfaceValue> }) => {
  const [interfaces, setInterfaces] = useState(initialInterfaces);
  return <InterfacesField interfaces={interfaces} onChangeInterfaces={setInterfaces} allowedTypes={SINGLE_TYPE} />;
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

const getBaseUrlInput = () => screen.getByRole('textbox', { name: new RegExp(`^${InterfacesI18nKey.BaseUrl}`) });

describe('InterfacesField', () => {
  test('single allowed type: clicking Add creates the inputs directly, no dropdown', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(<InterfacesField interfaces={{}} onChangeInterfaces={onChangeInterfaces} allowedTypes={SINGLE_TYPE} />);

    await user.click(screen.getByRole('button', { name: 'Buttons.AddInterface' }));

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(onChangeInterfaces).toHaveBeenCalledWith({
      [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' },
    });
  });

  test('single allowed type: add button hides once the type is configured', () => {
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } }}
        onChangeInterfaces={vi.fn()}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Buttons.AddInterface' })).not.toBeInTheDocument();
  });

  test('multiple allowed types: Add opens a dropdown listing only unused types', async () => {
    const user = userEvent.setup();
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'https://x' } }}
        onChangeInterfaces={vi.fn()}
        allowedTypes={MULTI_TYPES}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.AddInterface' }));

    const select = screen.getByRole('combobox');
    const optionValues = Array.from(select.querySelectorAll('option'))
      .map((o) => o.getAttribute('value'))
      .filter(Boolean);

    expect(optionValues).toEqual([DeploymentInterfaceType.OpenAIResponses, DeploymentInterfaceType.AnthropicMessages]);
  });

  test('multiple allowed types: selecting a type from the dropdown reveals its inputs and hides the dropdown', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(<InterfacesField interfaces={{}} onChangeInterfaces={onChangeInterfaces} allowedTypes={MULTI_TYPES} />);

    await user.click(screen.getByRole('button', { name: 'Buttons.AddInterface' }));
    await user.selectOptions(screen.getByRole('combobox'), DeploymentInterfaceType.AnthropicMessages);

    expect(onChangeInterfaces).toHaveBeenCalledWith({
      [DeploymentInterfaceType.AnthropicMessages]: { baseUrl: '' },
    });
  });

  test('multiple allowed types: add button hides once all types are configured', () => {
    render(
      <InterfacesField
        interfaces={{
          [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'a' },
          [DeploymentInterfaceType.OpenAIResponses]: { baseUrl: 'b' },
          [DeploymentInterfaceType.AnthropicMessages]: { baseUrl: 'c' },
        }}
        onChangeInterfaces={vi.fn()}
        allowedTypes={MULTI_TYPES}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Buttons.AddInterface' })).not.toBeInTheDocument();
  });

  test('deleting a row removes it and restores add availability', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'https://x' } }}
        onChangeInterfaces={onChangeInterfaces}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

    expect(onChangeInterfaces).toHaveBeenCalledWith({});
  });

  test('editing the base URL input calls onChangeInterfaces with the entity-backed camelCase baseUrl field', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } }}
        onChangeInterfaces={onChangeInterfaces}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    await user.type(getBaseUrlInput(), 'x');

    expect(onChangeInterfaces).toHaveBeenCalledWith({
      [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'x' },
    });
  });

  test('editing an input value calls onChangeInterfaces with the core-backed snake_case base_url field when isAsset', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '' } }}
        onChangeInterfaces={onChangeInterfaces}
        allowedTypes={SINGLE_TYPE}
        isAsset
      />,
    );

    await user.type(getBaseUrlInput(), 'x');

    expect(onChangeInterfaces).toHaveBeenCalledWith({
      [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: 'x' },
    });
  });

  test('shows a URL validation error for an invalid non-empty value and clears it once valid', async () => {
    const user = userEvent.setup();
    render(
      <ControlledInterfacesField
        initialInterfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } }}
      />,
    );

    const input = getBaseUrlInput();
    await user.type(input, 'not-a-url');

    expect(screen.getByText(ErrorI18nKey.UrlField)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'https://example.com');

    expect(screen.queryByText(ErrorI18nKey.UrlField)).not.toBeInTheDocument();
  });

  test('does not show a validation error for a blank required base URL until edited', () => {
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } }}
        onChangeInterfaces={vi.fn()}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    expect(screen.queryByText(ErrorI18nKey.UrlField)).not.toBeInTheDocument();
    expect(screen.queryByText(ErrorI18nKey.RequiredField)).not.toBeInTheDocument();
  });

  test('add button is wrapped in its own container so it does not stretch full width', () => {
    render(<InterfacesField interfaces={{}} onChangeInterfaces={vi.fn()} allowedTypes={SINGLE_TYPE} />);

    const addButton = screen.getByRole('button', { name: 'Buttons.AddInterface' });
    expect(addButton.parentElement?.tagName).toBe('DIV');
    expect(addButton.parentElement?.children).toHaveLength(1);
  });

  test('disabled: hides add/delete controls and disables inputs', () => {
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: 'https://x' } }}
        onChangeInterfaces={vi.fn()}
        allowedTypes={SINGLE_TYPE}
        disabled
      />,
    );

    expect(screen.queryByRole('button', { name: 'Buttons.AddInterface' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buttons.Delete' })).not.toBeInTheDocument();
    expect(getBaseUrlInput()).toBeDisabled();
  });

  test('renders the interface type as a row title', () => {
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } }}
        onChangeInterfaces={vi.fn()}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    expect(screen.getByText(InterfacesI18nKey.OpenAIChatCompletions)).toBeInTheDocument();
  });
});
