import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CATALOG_SCHEMA_META_COLUMNS } from '@/src/components/Common/SchemaGrid/constants';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import CatalogSchemaParameters from '../Parameters';

vi.mock('@/src/components/Common/SchemaGrid/SchemaGrid', () => ({
  default: ({ schema, metaColumns, isReadonly, onChange }: any) => (
    <div>
      <div>schema-grid:readonly={String(isReadonly)}</div>
      <div>schema-grid:meta={(metaColumns ?? []).join(',')}</div>
      <button onClick={() => onChange(schema)}>emit-schema</button>
      <button onClick={() => onChange({ properties: { added: { type: 'string' } } })}>add-field</button>
    </div>
  ),
}));

const schema = (overrides: Partial<DialCatalogSchemaResource> = {}): DialCatalogSchemaResource =>
  ({
    $id: 'https://dial.epam.com/catalog_schemas/agent',
    'dial:catalogEntityType': CatalogEntityType.Agent,
    'dial:catalogDisplayName': 'Agent',
    ...overrides,
  }) as DialCatalogSchemaResource;

const withProperties = () =>
  schema({
    properties: {
      badge: { type: 'string', format: 'dial-file-encoded', 'dial:file': true },
      summary: { type: 'string', 'dial:meta': { 'dial:tab': 'About' } },
    } as DialCatalogSchemaResource['properties'],
  });

describe('CatalogSchemaParameters', () => {
  test('Should edit the schema in place, with no read-only mode and no resolved read', () => {
    render(<CatalogSchemaParameters schema={withProperties()} onChange={vi.fn()} />);

    expect(screen.getByText('schema-grid:readonly=undefined')).toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.NoConfigurationSchema)).not.toBeInTheDocument();
  });

  test('Should ask the grid for the catalog presentation-hint columns', () => {
    render(<CatalogSchemaParameters schema={withProperties()} onChange={vi.fn()} />);

    expect(screen.getByText(`schema-grid:meta=${CATALOG_SCHEMA_META_COLUMNS.join(',')}`)).toBeInTheDocument();
  });

  /** The grid carries the only add-field action, so gating it on emptiness was a dead end. */
  test('Should render the grid, not an empty state, when the schema declares no properties', () => {
    render(<CatalogSchemaParameters schema={schema()} onChange={vi.fn()} />);

    expect(screen.getByText('schema-grid:readonly=undefined')).toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.NoConfigurationSchema)).not.toBeInTheDocument();
  });

  test('Should store the first property added to a schema that declared none, keeping its identity', () => {
    const onChange = vi.fn();

    render(<CatalogSchemaParameters schema={schema()} onChange={onChange} />);
    screen.getByText('add-field').click();

    expect(onChange).toHaveBeenCalledWith(
      {
        $id: 'https://dial.epam.com/catalog_schemas/agent',
        'dial:catalogEntityType': CatalogEntityType.Agent,
        'dial:catalogDisplayName': 'Agent',
        properties: { added: { type: 'string' } },
      },
      undefined,
    );
  });

  test('Should hand the edited schema back with dial:file, format and dial:meta intact', () => {
    const onChange = vi.fn();
    const entity = withProperties();

    render(<CatalogSchemaParameters schema={entity} onChange={onChange} />);
    screen.getByText('emit-schema').click();

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ properties: entity.properties }), undefined);
  });
});
