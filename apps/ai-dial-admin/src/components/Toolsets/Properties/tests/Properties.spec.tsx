import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ToolsetProperties from '../Properties';
import { Toolset } from '@/src/models/dial/toolset';

vi.mock('@/src/components/EntityMainProperties/Properties/DeploymentProperties', () => ({
  default: () => <div>deployment-properties</div>,
}));

vi.mock('@/src/components/Toolsets/Auth/Authentication', () => ({
  default: () => <div>authentication</div>,
}));

vi.mock('@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField', () => ({
  default: () => <div>forward-auth-token</div>,
}));

vi.mock('@/src/components/BaseControls/MaxRetryAttempts', () => ({
  default: () => <div>max-retry-attempts</div>,
}));

const baseToolset: Toolset = { name: 'toolset-1', displayName: 'Toolset 1' };

describe('ToolsetProperties', () => {
  test('renders the vendor website field with its current value', () => {
    render(
      <ToolsetProperties
        selectedToolset={{ ...baseToolset, vendorWebsite: 'https://vendor.example.com' }}
        names={[]}
        onChangeToolset={vi.fn()}
      />,
    );

    expect(screen.getByRole('textbox', { name: /vendorWebsite/i })).toHaveValue('https://vendor.example.com');
  });

  test('calls onChangeToolset with the updated vendorWebsite, preserving other fields', async () => {
    const user = userEvent.setup();
    const onChangeToolset = vi.fn();

    render(<ToolsetProperties selectedToolset={baseToolset} names={[]} onChangeToolset={onChangeToolset} />);

    await user.type(screen.getByRole('textbox', { name: /vendorWebsite/i }), 'h');

    expect(onChangeToolset).toHaveBeenCalledWith({ ...baseToolset, vendorWebsite: 'h' });
  });
});
