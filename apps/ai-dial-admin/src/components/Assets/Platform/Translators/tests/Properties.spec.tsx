import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import type { PluginOptions } from '@/src/server/config-entities/read-plugin-options';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import TranslatorAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();

  return {
    ...actual,
    Select: ({ id, labelProps: { label } = {}, value, options, onChange }: any) => (
      <div>
        {label !== undefined && <label htmlFor={id}>{label}</label>}
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="" />
          {options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    ),
  };
});

const baseAsset = {
  name: 'to-responses',
  path: 'to-responses',
  folderId: '',
} as DialTranslatorResource;

const renderProperties = (asset: Partial<DialTranslatorResource> = {}, plugins?: PluginOptions) =>
  render(
    <TranslatorAssetProperties asset={{ ...baseAsset, ...asset }} plugins={plugins} onChange={vi.fn()} />,
  );

describe('Translator asset Properties', () => {
  test('Should render the in/out interface-type fields and a base URL field', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.translatorIn)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.translatorOut)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.baseUrl)).toBeInTheDocument();
  });

  test('Should render the base URL with the given value', () => {
    renderProperties({ baseUrl: 'http://dial-bedrock-translator/to-responses' });

    expect(screen.getByDisplayValue('http://dial-bedrock-translator/to-responses')).toBeInTheDocument();
  });

  test('Should render no display name, description, or topics control — Translator has none of those', () => {
    renderProperties();

    expect(screen.queryByText(EntityFieldsI18nKey.displayName)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.description)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.topics)).not.toBeInTheDocument();
  });

  test('shows a read-only plugin reference without editable source choices', () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);
    renderProperties({ baseUrl: 'dial-plugin://example/v2' });
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);

    expect(screen.getByRole('textbox', { name: /EntityFields.baseUrl/ })).toHaveValue('dial-plugin://example/v2');
    expect(screen.getByRole('textbox', { name: /EntityFields.baseUrl/ })).toBeDisabled();
    expect(screen.queryByRole('radio', { name: BasicI18nKey.Plugin })).not.toBeInTheDocument();
  });

  test('preserves a missing plugin reference and suffix when options are unavailable', () => {
    const onChange = vi.fn();
    render(
      <TranslatorAssetProperties
        asset={{ ...baseAsset, baseUrl: 'dial-plugin://missing/v2' }}
        plugins={{ options: [], error: EntitiesI18nKey.OptionListUnavailable }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('radio', { name: BasicI18nKey.Plugin })).toBeChecked();
    expect(screen.getByRole('combobox', { name: BasicI18nKey.Plugin })).toHaveValue('dial-plugin://missing');
    expect(screen.getByRole('status')).toHaveTextContent(EntitiesI18nKey.OptionListUnavailable);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('writes a changed plugin without altering the other translator fields', () => {
    const onChange = vi.fn();
    const asset = { ...baseAsset, baseUrl: 'dial-plugin://missing/v2' };
    render(<TranslatorAssetProperties asset={asset} plugins={{ options: ['other'] }} onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox', { name: BasicI18nKey.Plugin }), {
      target: { value: 'dial-plugin://other' },
    });
    expect(onChange).toHaveBeenCalledWith({ ...asset, baseUrl: 'dial-plugin://other' });
  });

  test('Should call onChange with the selected in-interface type', () => {
    const onChange = vi.fn();
    render(<TranslatorAssetProperties asset={baseAsset} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(EntityFieldsI18nKey.translatorIn), {
      target: { value: DeploymentInterfaceType.AnthropicMessages },
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ in: DeploymentInterfaceType.AnthropicMessages }));
  });

  test('Should call onChange with the selected out-interface type', () => {
    const onChange = vi.fn();
    render(<TranslatorAssetProperties asset={baseAsset} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(EntityFieldsI18nKey.translatorOut), {
      target: { value: DeploymentInterfaceType.OpenAIResponses },
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ out: DeploymentInterfaceType.OpenAIResponses }));
  });
});
