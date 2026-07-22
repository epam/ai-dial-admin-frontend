import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ToolsetAssetProperties from '../Properties';
import { DialToolsetResource } from '@/src/models/dial/resource';

vi.mock('@/src/components/Assets/Header/FolderStorage', () => ({ default: () => <div>folders-storage-label</div> }));
vi.mock('@/src/components/Assets/Resources/Auth/ResourceAuthHeader', () => ({
  default: () => <div>resource-auth-header</div>,
}));
vi.mock('@/src/components/Assets/Resources/ResourceInfoHeader', () => ({
  default: () => <div>resource-info-header</div>,
}));
vi.mock('@/src/components/BaseControls/Icon', () => ({ default: () => <div>icon-control</div> }));
vi.mock('@/src/components/BaseControls/Topics', () => ({ default: () => <div>topics-control</div> }));
vi.mock('@/src/components/Common/FilePath/FilePath', () => ({ default: () => <div>file-path</div> }));
vi.mock('@/src/components/SourceField/Endpoints/ToolsetEndpoint', () => ({
  default: () => <div>toolset-endpoint</div>,
}));
vi.mock('@/src/components/Assets/Resources/Auth/ResourceAuthentication', () => ({
  default: () => <div>resource-authentication</div>,
}));
vi.mock('@/src/components/BaseControls/MaxRetryAttempts', () => ({ default: () => <div>max-retry-attempts</div> }));

const baseToolset: DialToolsetResource = {
  name: 'toolset-1',
  displayName: 'Toolset 1',
} as DialToolsetResource;

describe('ToolsetAssetProperties', () => {
  test('renders intro and vendor website fields', () => {
    render(
      <ToolsetAssetProperties
        selectedToolset={{ ...baseToolset, intro: 'Intro text', vendor_website: 'https://vendor.example.com' }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('textbox').some((el) => (el as HTMLTextAreaElement).value === 'Intro text')).toBe(true);
    expect(screen.getByRole('textbox', { name: /vendorWebsite/i })).toHaveValue('https://vendor.example.com');
  });

  test('calls onChange with the updated vendor website, preserving snake_case fields', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ToolsetAssetProperties selectedToolset={baseToolset} onChange={onChange} />);

    await user.type(screen.getByRole('textbox', { name: /vendorWebsite/i }), 'h');

    expect(onChange).toHaveBeenCalledWith({ ...baseToolset, vendor_website: 'h' });
  });
});
