import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ApplicationAssetProperties from '../Properties';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialApplicationResource } from '@/src/models/dial/resource';

const mockSourceField = vi.fn();
const mockVersionControl = vi.fn();

vi.mock('@/src/components/Assets/Header/FolderStorage', () => ({ default: () => <div>folders-storage-label</div> }));
vi.mock('@/src/components/Assets/Resources/ResourceInfoHeader', () => ({
  default: () => <div>resource-info-header</div>,
}));
vi.mock('@/src/components/Assets/Resources/ResourceSourceField', () => ({
  default: (props: unknown) => {
    mockSourceField(props);
    return <div>resource-source-field</div>;
  },
}));
vi.mock('@/src/components/BaseControls/Icon', () => ({ default: () => <div>icon-control</div> }));
vi.mock('@/src/components/BaseControls/MaxRetryAttempts', () => ({ default: () => <div>max-retry-attempts</div> }));
vi.mock('@/src/components/BaseControls/Topics', () => ({ default: () => <div>topics-control</div> }));
vi.mock('@/src/components/BaseControls/Version', () => ({
  default: (props: { version?: string; onChange: (version?: string) => void }) => {
    mockVersionControl(props);
    return <div>version-control</div>;
  },
}));
vi.mock('@/src/components/Common/FilePath/FilePath', () => ({ default: () => <div>file-path</div> }));
vi.mock('@/src/components/Common/KeyValueGrid/KeyValueGrid', () => ({
  default: ({ label }: { label?: string }) => <div>key-value-grid: {label}</div>,
}));
vi.mock('@/src/components/Defaults/Defaults', () => ({ default: () => <div>defaults</div> }));
vi.mock('@/src/components/Assets/Resources/Auth/ResourceMultiAuth', () => ({
  default: () => <div>resource-multi-auth</div>,
}));
vi.mock('@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments', () => ({
  default: () => <div>entity-attachments</div>,
}));

const baseAsset: DialApplicationResource = {
  name: 'app-1',
  display_name: 'App 1',
} as DialApplicationResource;

describe('ApplicationAssetProperties', () => {
  test('renders an intro field alongside description', () => {
    render(<ApplicationAssetProperties asset={{ ...baseAsset, intro: 'Intro text' }} onChange={vi.fn()} />);

    expect(screen.getByText(EntityFieldsI18nKey.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').some((el) => (el as HTMLTextAreaElement).value === 'Intro text')).toBe(true);
  });

  test('renders the folder-move control for a public-bucket application', () => {
    render(<ApplicationAssetProperties asset={{ ...baseAsset, folderId: 'public/' }} onChange={vi.fn()} />);

    expect(screen.getByText('file-path')).toBeInTheDocument();
  });

  test('hides the folder-move control for a platform-bucket application — the bucket has no folders', () => {
    render(<ApplicationAssetProperties asset={{ ...baseAsset, folderId: 'platform/' }} onChange={vi.fn()} />);

    expect(screen.queryByText('file-path')).not.toBeInTheDocument();
  });

  test('renders an entity-level base_url field, positioned before Interfaces', () => {
    render(<ApplicationAssetProperties asset={{ ...baseAsset, base_url: 'http://app-base' }} onChange={vi.fn()} />);

    expect(screen.getByText(EntityFieldsI18nKey.baseUrl)).toBeInTheDocument();
    expect(screen.getByDisplayValue('http://app-base')).toBeInTheDocument();
  });

  test('passes the entity to ResourceSourceField so interfaces can use its base_url fallback', () => {
    const asset = { ...baseAsset, base_url: 'http://app-base' };
    render(<ApplicationAssetProperties asset={asset} onChange={vi.fn()} />);

    expect(mockSourceField).toHaveBeenCalledWith(expect.objectContaining({ entity: asset }));
  });

  test('shows the publication version from _metadata.version', () => {
    const asset = { ...baseAsset, _metadata: { version: '1.0.0' } } as DialApplicationResource;
    render(<ApplicationAssetProperties asset={asset} onChange={vi.fn()} isPublication />);

    expect(mockVersionControl).toHaveBeenLastCalledWith(expect.objectContaining({ version: '1.0.0' }));
  });

  test('writes an edited publication version to _metadata.version and display_version', () => {
    const onChange = vi.fn();
    const asset = { ...baseAsset, _metadata: { name: 'app-1', version: '1.0.0' } } as DialApplicationResource;
    render(<ApplicationAssetProperties asset={asset} onChange={onChange} isPublication />);

    mockVersionControl.mock.lastCall?.[0].onChange('2.0.0');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        display_version: '2.0.0',
        _metadata: expect.objectContaining({ name: 'app-1', version: '2.0.0' }),
      }),
    );
  });

  test('does not render the version control outside a publication', () => {
    render(<ApplicationAssetProperties asset={baseAsset} onChange={vi.fn()} />);

    expect(screen.queryByText('version-control')).not.toBeInTheDocument();
  });

  test('renders a default headers editor', () => {
    render(<ApplicationAssetProperties asset={baseAsset} onChange={vi.fn()} />);

    expect(screen.getByText(`key-value-grid: ${EntityFieldsI18nKey.defaultHeaders}`)).toBeInTheDocument();
  });
});
