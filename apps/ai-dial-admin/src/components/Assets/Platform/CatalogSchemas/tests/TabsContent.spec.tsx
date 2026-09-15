import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Properties', () => ({ default: () => <div>properties-tab</div> }));
vi.mock('../Parameters', () => ({ default: () => <div>parameters-tab</div> }));

const schema = {
  $id: 'https://dial.epam.com/catalog_schemas/agent',
  'dial:catalogEntityType': CatalogEntityType.Agent,
  'dial:catalogDisplayName': 'Agent',
} as DialCatalogSchemaResource;

describe('CatalogSchemas TabsContent', () => {
  test('Should render the Properties tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Properties} schema={schema} onChange={vi.fn()} />);

    expect(screen.getByText('properties-tab')).toBeInTheDocument();
    expect(screen.queryByText('parameters-tab')).not.toBeInTheDocument();
  });

  test('Should render the Parameters tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Parameters} schema={schema} onChange={vi.fn()} />);

    expect(screen.getByText('parameters-tab')).toBeInTheDocument();
    expect(screen.queryByText('properties-tab')).not.toBeInTheDocument();
  });

  test.each([EntityViewTab.Features, EntityViewTab.AppRoutes, EntityViewTab.Interceptors, EntityViewTab.Roles])(
    'Should render nothing for the %s tab, which this entity does not have',
    (tab) => {
      render(<TabsContent activeTab={tab} schema={schema} onChange={vi.fn()} />);

      expect(screen.queryByText('properties-tab')).not.toBeInTheDocument();
      expect(screen.queryByText('parameters-tab')).not.toBeInTheDocument();
    },
  );
});
