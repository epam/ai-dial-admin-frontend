import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import { EntityFieldsI18nKey, ErrorI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType, InterfaceMode, TranslatorReference } from '@/src/models/dial/interfaces';

type InterfaceValue = {
  baseUrl?: string;
  base_url?: string;
  mode?: InterfaceMode;
  translator?: TranslatorReference;
};

const ControlledInterfacesField = ({ initialInterfaces }: { initialInterfaces: Record<string, InterfaceValue> }) => {
  const [interfaces, setInterfaces] = useState(initialInterfaces);
  return <InterfacesField interfaces={interfaces} onChangeInterfaces={setInterfaces} allowedTypes={SINGLE_TYPE} />;
};

const ControlledAssetInterfacesField = ({
  initialInterfaces,
  translators = [],
}: {
  initialInterfaces: Record<string, InterfaceValue>;
  translators?: { name: string }[];
}) => {
  const [interfaces, setInterfaces] = useState(initialInterfaces);
  return (
    <InterfacesField
      interfaces={interfaces}
      onChangeInterfaces={setInterfaces}
      allowedTypes={SINGLE_TYPE}
      translators={translators as any}
      isAsset
    />
  );
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

  test('does not render a mode selector when isAsset is not set', () => {
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { baseUrl: '' } }}
        onChangeInterfaces={vi.fn()}
        allowedTypes={SINGLE_TYPE}
      />,
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('InterfacesField — asset surfaces: mode & translator', () => {
  const modeSelect = () =>
    screen.getByRole('combobox', { name: `interface-${DeploymentInterfaceType.OpenAIChatCompletions}-mode` });
  const translatorSelect = () => screen.getByRole('combobox', { name: InterfacesI18nKey.SelectTranslator });
  const outSelect = () =>
    screen.getByRole('combobox', {
      name: `interface-${DeploymentInterfaceType.OpenAIChatCompletions}-translator-out`,
    });

  test('defaults to passthrough and shows the base_url input', () => {
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '' } }}
      />,
    );

    expect(getBaseUrlInput()).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: InterfacesI18nKey.SelectTranslator })).not.toBeInTheDocument();
  });

  test('an existing interface with a saved mode of translator still renders identically to passthrough when mode is absent', () => {
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: 'https://x' } }}
      />,
    );

    expect(getBaseUrlInput()).toHaveValue('https://x');
  });

  test('switching mode to translator hides base_url and shows the translator picker', async () => {
    const user = userEvent.setup();
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '' } }}
        translators={[{ name: 'my-translator' }]}
      />,
    );

    await user.selectOptions(modeSelect(), InterfaceMode.Translator);

    expect(
      screen.queryByRole('textbox', { name: new RegExp(`^${InterfacesI18nKey.BaseUrl}`) }),
    ).not.toBeInTheDocument();
    expect(translatorSelect()).toBeInTheDocument();
  });

  test('switching mode to translator clears the previously saved base_url — the two are mutually exclusive', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(
      <InterfacesField
        interfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: 'https://old-value' } }}
        onChangeInterfaces={onChangeInterfaces}
        allowedTypes={SINGLE_TYPE}
        isAsset
      />,
    );

    await user.selectOptions(modeSelect(), InterfaceMode.Translator);

    expect(onChangeInterfaces).toHaveBeenCalledWith({
      [DeploymentInterfaceType.OpenAIChatCompletions]: {
        base_url: undefined,
        mode: InterfaceMode.Translator,
      },
    });
  });

  test('switching mode back to passthrough clears the previously saved translator', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(
      <InterfacesField
        interfaces={{
          [DeploymentInterfaceType.OpenAIChatCompletions]: {
            mode: InterfaceMode.Translator,
            translator: 'my-translator',
          },
        }}
        onChangeInterfaces={onChangeInterfaces}
        allowedTypes={SINGLE_TYPE}
        isAsset
      />,
    );

    await user.selectOptions(modeSelect(), InterfaceMode.Passthrough);

    expect(onChangeInterfaces).toHaveBeenCalledWith({
      [DeploymentInterfaceType.OpenAIChatCompletions]: {
        mode: InterfaceMode.Passthrough,
        translator: undefined,
      },
    });
  });

  test('re-entering a base_url after switching back to passthrough starts blank, not with the pre-translator value', async () => {
    const user = userEvent.setup();
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: 'https://old-value' } }}
        translators={[{ name: 'my-translator' }]}
      />,
    );

    await user.selectOptions(modeSelect(), InterfaceMode.Translator);
    await user.selectOptions(modeSelect(), InterfaceMode.Passthrough);

    expect(getBaseUrlInput()).toHaveValue('');
  });

  test('selecting a named translator stores it as a plain name reference', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(
      <InterfacesField
        interfaces={{
          [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '', mode: InterfaceMode.Translator },
        }}
        onChangeInterfaces={onChangeInterfaces}
        allowedTypes={SINGLE_TYPE}
        translators={[{ name: 'my-translator' } as any]}
        isAsset
      />,
    );

    await user.selectOptions(translatorSelect(), 'my-translator');

    expect(onChangeInterfaces).toHaveBeenCalledWith({
      [DeploymentInterfaceType.OpenAIChatCompletions]: {
        base_url: '',
        mode: InterfaceMode.Translator,
        translator: 'my-translator',
      },
    });
  });

  test('selecting Custom reveals an inline base_url input and an out selector, with no in control', async () => {
    const user = userEvent.setup();
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{
          [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '', mode: InterfaceMode.Translator },
        }}
      />,
    );

    await user.selectOptions(translatorSelect(), InterfacesI18nKey.Custom);

    expect(screen.getByRole('textbox', { name: new RegExp(`^${EntityFieldsI18nKey.baseUrl}`) })).toBeInTheDocument();
    expect(outSelect()).toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.translatorIn)).not.toBeInTheDocument();
  });

  test('the out selector excludes the interface type this row is configured for', async () => {
    const user = userEvent.setup();
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{
          [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '', mode: InterfaceMode.Translator },
        }}
      />,
    );

    await user.selectOptions(translatorSelect(), InterfacesI18nKey.Custom);

    const outOptionValues = Array.from(outSelect().querySelectorAll('option'))
      .map((o) => o.getAttribute('value'))
      .filter(Boolean);

    expect(outOptionValues).not.toContain(DeploymentInterfaceType.OpenAIChatCompletions);
  });

  test('defaults the Custom out value to a type other than the row it is attached to', async () => {
    const user = userEvent.setup();
    const onChangeInterfaces = vi.fn();
    render(
      <InterfacesField
        interfaces={{
          [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '', mode: InterfaceMode.Translator },
        }}
        onChangeInterfaces={onChangeInterfaces}
        allowedTypes={SINGLE_TYPE}
        isAsset
      />,
    );

    await user.selectOptions(translatorSelect(), InterfacesI18nKey.Custom);

    const [[updatedInterfaces]] = onChangeInterfaces.mock.calls.slice(-1);
    expect(
      (updatedInterfaces[DeploymentInterfaceType.OpenAIChatCompletions] as { out: DeploymentInterfaceType }).out,
    ).not.toBe(DeploymentInterfaceType.OpenAIChatCompletions);
  });

  test('filling in the Custom translator stores an inline base_url/out object, not a name', async () => {
    const user = userEvent.setup();
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{
          [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '', mode: InterfaceMode.Translator },
        }}
      />,
    );

    await user.selectOptions(translatorSelect(), InterfacesI18nKey.Custom);
    await user.type(screen.getByRole('textbox', { name: new RegExp(`^${EntityFieldsI18nKey.baseUrl}`) }), 'x');

    expect(screen.getByRole('textbox', { name: new RegExp(`^${EntityFieldsI18nKey.baseUrl}`) })).toHaveValue('x');
  });

  test('renders a default headers editor and Defaults/Features buttons for an asset interface', () => {
    render(
      <ControlledAssetInterfacesField
        initialInterfaces={{ [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: '' } }}
      />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.defaultHeaders)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Defaults' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Features' })).toBeInTheDocument();
  });
});
