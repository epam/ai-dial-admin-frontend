import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import { getCatalogSchemaById } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialModelResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-catalog-schemas/actions')>()),
  getCatalogSchemaById: vi.fn().mockResolvedValue({ success: true, response: {} }),
}));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

interface FieldProps {
  schemaId?: string;
  options?: CatalogSchemaOption[];
  optionsError?: string;
  onChange: (schemaId?: string) => void;
}

interface EditorProps {
  schemaId?: string;
  values?: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

let capturedFieldProps: FieldProps | undefined;
let capturedEditorProps: EditorProps | undefined;

vi.mock('@/src/components/CatalogProperties/CatalogSchemaField', () => ({
  default: (props: FieldProps) => {
    capturedFieldProps = props;
    return (
      <button type="button" onClick={() => props.onChange('https://host/agent-card')}>
        catalog-schema-field
      </button>
    );
  },
}));

vi.mock('@/src/components/CatalogProperties/CatalogPropertiesEditor', () => ({
  default: (props: EditorProps) => {
    capturedEditorProps = props;
    return props.schemaId ? (
      <button type="button" onClick={() => props.onChange({ tag: 'Featured' })}>
        catalog-values-editor
      </button>
    ) : (
      <span>{EntitiesI18nKey.NoCatalogSchemaSelected}</span>
    );
  },
}));

const options: CatalogSchemaOption[] = [{ $id: 'https://host/agent-card', 'dial:catalogDisplayName': 'Agent card' }];

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsTopics: vi.fn(() => Promise.resolve({ success: true, response: [] })),
  getModelsTokenizers: vi.fn(() => Promise.resolve({ success: true, response: [] })),
  getModelsAdapters: vi.fn(() => Promise.resolve({ success: true, response: [] })),
}));

const renderTabs = (activeTab: EntityViewTab, overrides: Partial<DialModelResource> = {}, onChange = vi.fn()) => {
  const selected = { name: 'gpt-4', path: 'gpt-4', folderId: '', ...overrides } as unknown as AssetModel;
  render(
    <TabsContent
      activeTab={activeTab}
      selectedModel={selected}
      originalModel={selected}
      roles={[]}
      interceptors={[]}
      catalogSchemas={{ options }}
      onChange={onChange}
    />,
  );
  return onChange;
};

describe('Catalog model :: catalog metadata wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('offers the schema picker on the Properties tab', () => {
    renderTabs(EntityViewTab.Properties);

    expect(screen.getByRole('button', { name: 'catalog-schema-field' })).toBeTruthy();
    expect(capturedFieldProps?.options).toEqual(options);
  });

  test('stores a picked schema as catalogSchemaId', () => {
    const onChange = renderTabs(EntityViewTab.Properties);

    capturedFieldProps?.onChange('https://host/agent-card');

    expect(onChange.mock.calls[0][0]).toMatchObject({ catalogSchemaId: 'https://host/agent-card' });
  });

  test('shows the empty state on the Catalog tab with no schema selected', () => {
    renderTabs(EntityViewTab.Catalog);

    expect(screen.getByText(EntitiesI18nKey.NoCatalogSchemaSelected)).toBeTruthy();
  });

  test('stores edited values as catalogProperties', () => {
    const onChange = renderTabs(EntityViewTab.Catalog, { catalogSchemaId: 'https://host/agent-card' });

    expect(capturedEditorProps?.schemaId).toEqual('https://host/agent-card');
    capturedEditorProps?.onChange({ tag: 'Featured' });

    expect(onChange.mock.calls[0][0]).toMatchObject({ catalogProperties: { tag: 'Featured' } });
  });

  /**
   * The gate has to run from here, not from the tab body: the editor renders only while its own tab
   * is active, so stored values that violate the schema would otherwise never be validated.
   */
  test('validates the stored values with the Catalog tab never opened', async () => {
    renderTabs(EntityViewTab.Properties, { catalogSchemaId: 'https://host/agent-card' });

    await waitFor(() => expect(getCatalogSchemaById).toHaveBeenCalledWith('https://host/agent-card'));
    expect(screen.queryByRole('button', { name: 'catalog-values-editor' })).toBeNull();
  });

  test('re-resolves the schema when the selection changes, so the gate follows it', async () => {
    renderTabs(EntityViewTab.Properties, { catalogSchemaId: 'https://host/model-card' });

    await waitFor(() => expect(getCatalogSchemaById).toHaveBeenCalledWith('https://host/model-card'));
  });

  test('resolves nothing when no schema is selected', () => {
    renderTabs(EntityViewTab.Properties);

    expect(getCatalogSchemaById).not.toHaveBeenCalled();
  });

  test('reports a failed option read through to the picker', () => {
    const selected = { name: 'gpt-4', path: 'gpt-4', folderId: '' } as unknown as AssetModel;
    render(
      <TabsContent
        activeTab={EntityViewTab.Properties}
        selectedModel={selected}
        originalModel={selected}
        roles={[]}
        interceptors={[]}
        catalogSchemas={{ options: [], error: EntitiesI18nKey.OptionListUnavailable }}
        onChange={vi.fn()}
      />,
    );

    expect(capturedFieldProps?.optionsError).toEqual(EntitiesI18nKey.OptionListUnavailable);
  });
});
