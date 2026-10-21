import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import CatalogSchemaProperties from '../Properties';

vi.mock('../CreateProperties', () => ({
  default: ({ isModal }: any) => <div>create-properties:modal={String(isModal)}</div>,
}));

const schema = {
  $id: 'https://dial.epam.com/catalog_schemas/agent',
  'dial:catalogEntityType': CatalogEntityType.Agent,
  'dial:catalogDisplayName': 'Agent',
  name: 'agent',
  path: 'agent',
  folderId: '',
} as DialCatalogSchemaResource;

describe('CatalogSchemaProperties', () => {
  test('Should render the shared field set in details mode, so the id stays read-only', () => {
    render(<CatalogSchemaProperties schema={schema} onChange={vi.fn()} />);

    expect(screen.getByText('create-properties:modal=false')).toBeInTheDocument();
  });
});
