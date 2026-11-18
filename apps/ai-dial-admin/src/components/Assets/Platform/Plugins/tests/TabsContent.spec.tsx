import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DialPluginResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Properties', () => ({ default: () => <div>properties</div> }));

const plugin = { name: 'my-plugin', type: 'forward' } as DialPluginResource;

describe('Plugin asset TabsContent', () => {
  test('renders Properties for the Properties tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Properties} selectedPlugin={plugin} onChange={vi.fn()} />);

    expect(screen.getByText('properties')).toBeInTheDocument();
  });

  test('renders nothing for any other tab, since a plugin has no Roles tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Roles} selectedPlugin={plugin} onChange={vi.fn()} />);

    expect(screen.queryByText('properties')).not.toBeInTheDocument();
  });
});
