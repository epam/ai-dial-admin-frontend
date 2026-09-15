import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import { DialApplication } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
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

const baseProps = {
  applications: [],
  models: [],
  roles: [],
  interceptors: [],
  applicationSchemes: [],
  names: [],
  isSkipRefresh: true,
  isEditorEnabled: false,
  catalogSchemas: { options },
};

const renderTabs = (
  activeTab: EntityViewTab,
  overrides: Partial<DialApplicationResource> = {},
  view = ApplicationRoute.AssetsApplications,
  onChangeApplication = vi.fn(),
) => {
  const selected = { name: 'app', ...overrides } as unknown as DialApplication;
  render(
    <TabsContent
      {...baseProps}
      activeTab={activeTab}
      view={view}
      selectedApplication={selected}
      onChangeApplication={onChangeApplication}
    />,
  );
  return onChangeApplication;
};

describe('Application asset :: catalog metadata wiring', () => {
  test('offers the schema picker on the Properties tab', () => {
    renderTabs(EntityViewTab.Properties);

    expect(screen.getByRole('button', { name: 'catalog-schema-field' })).toBeTruthy();
    expect(capturedFieldProps?.options).toEqual(options);
  });

  test('stores a picked schema as catalog_schema_id', () => {
    const onChange = renderTabs(EntityViewTab.Properties);

    capturedFieldProps?.onChange('https://host/agent-card');

    expect(onChange.mock.calls[0][0]).toMatchObject({ catalog_schema_id: 'https://host/agent-card' });
  });

  test('shows the empty state on the Catalog tab with no schema selected', () => {
    renderTabs(EntityViewTab.Catalog);

    expect(screen.getByText(EntitiesI18nKey.NoCatalogSchemaSelected)).toBeTruthy();
  });

  test('stores edited values as catalog_properties', () => {
    const onChange = renderTabs(EntityViewTab.Catalog, { catalog_schema_id: 'https://host/agent-card' });

    expect(capturedEditorProps?.schemaId).toEqual('https://host/agent-card');
    capturedEditorProps?.onChange({ tag: 'Featured' });

    expect(onChange.mock.calls[0][0]).toMatchObject({ catalog_properties: { tag: 'Featured' } });
  });

  test('offers no catalog editor on the admin-backend Applications view', () => {
    renderTabs(EntityViewTab.Catalog, { catalog_schema_id: 'https://host/agent-card' }, ApplicationRoute.Applications);

    expect(screen.queryByRole('button', { name: 'catalog-values-editor' })).toBeNull();
  });
});
