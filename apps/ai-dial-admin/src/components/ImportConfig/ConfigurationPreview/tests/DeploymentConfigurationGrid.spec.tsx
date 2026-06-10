import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import DeploymentConfigurationGrid from '../DeploymentConfigurationGrid';
import { GLOBAL_FIREWALL_TAB_ID } from '@/src/constants/deployments/import';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FileComponentItem } from '@/src/models/import';

const firewallItem = (next: string[]): FileComponentItem => ({
  importAction: 'UPDATE',
  next: next as unknown as BaseEntity,
  prev: [] as unknown as BaseEntity,
});

const baseProps = {
  selectedTab: GLOBAL_FIREWALL_TAB_ID,
  tabData: {},
  currentState: {},
  prevState: {},
  globalFirewall: firewallItem(['a.com', 'bad!']),
};

describe('DeploymentConfigurationGrid — Global Firewall tab', () => {
  test('decorates the invalid domain via the per-domain error map', () => {
    render(
      <DeploymentConfigurationGrid
        {...baseProps}
        firewallErrorsByDomain={{ 'bad!': ["domain 'bad!' is not a valid domain name"] }}
      />,
    );

    expect(screen.getByText('bad!')).toHaveClass('text-error');
    expect(screen.getByLabelText('bad!')).toBeInTheDocument();
    expect(screen.getByText('a.com')).not.toHaveClass('text-error');
  });

  test('renders no decoration when there are no firewall errors', () => {
    render(<DeploymentConfigurationGrid {...baseProps} firewallErrorsByDomain={{}} />);

    expect(screen.getByText('bad!')).not.toHaveClass('text-error');
    expect(screen.queryByLabelText('bad!')).not.toBeInTheDocument();
  });
});
