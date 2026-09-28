import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import { DialInterceptorResource } from '@/src/models/dial/resource';
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

vi.mock('@/src/app/[lang]/platform-interceptors/actions', () => ({
  getInterceptorConfigurationSchema: vi.fn().mockResolvedValue({ success: true, response: null }),
}));

const renderTabs = (activeTab: EntityViewTab, overrides: Partial<DialInterceptorResource> = {}, onChange = vi.fn()) => {
  const selected = { name: 'redactor', path: 'redactor', folderId: '', ...overrides } as DialInterceptorResource;
  render(
    <TabsContent
      activeTab={activeTab}
      selectedInterceptor={selected}
      catalogSchemas={{ options }}
      onChange={onChange}
    />,
  );
  return onChange;
};

describe('Catalog interceptor :: catalog metadata wiring', () => {
  test('offers the schema picker on the Properties tab', () => {
    renderTabs(EntityViewTab.Properties);

    expect(screen.getByRole('button', { name: 'catalog-schema-field' })).toBeTruthy();
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

    capturedEditorProps?.onChange({ tag: 'Featured' });

    expect(onChange.mock.calls[0][0]).toMatchObject({ catalogProperties: { tag: 'Featured' } });
  });

  test('leaves the parameter-schema tab unchanged for an interceptor with no catalog schema', () => {
    renderTabs(EntityViewTab.ParameterSchema);

    expect(screen.getByText(EntitiesI18nKey.NoConfigurationSchema)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'catalog-values-editor' })).toBeNull();
  });
});
