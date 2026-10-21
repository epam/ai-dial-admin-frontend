import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
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
    DialSelectField: ({ id, label, value, options, onChange }: any) => (
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

const renderProperties = (asset: Partial<DialTranslatorResource> = {}) =>
  render(<TranslatorAssetProperties asset={{ ...baseAsset, ...asset }} onChange={vi.fn()} />);

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
