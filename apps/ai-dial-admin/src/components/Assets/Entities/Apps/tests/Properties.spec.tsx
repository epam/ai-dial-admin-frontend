import { beforeEach, describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useAppContext } from '@/src/context/AppContext';
import { fireEvent, render, screen } from '@testing-library/react';

import ApplicationAssetProperties from '@/src/components/Assets/Entities/Apps/Properties';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DialApplicationResource } from '@/src/models/dial/resource';

const mockSourceField = vi.fn();

vi.mock('@/src/components/Assets/Header/FolderStorage', () => ({ default: () => <div>folders-storage-label</div> }));
vi.mock('@/src/components/Assets/Resources/ResourceSourceField', () => ({
  default: (props: unknown) => {
    mockSourceField(props);
    return <div>resource-source-field</div>;
  },
}));
vi.mock('@/src/components/BaseControls/Icon', () => ({ default: () => <div>icon-control</div> }));
vi.mock('@/src/components/BaseControls/MaxRetryAttempts', () => ({ default: () => <div>max-retry-attempts</div> }));
vi.mock('@/src/components/BaseControls/Topics', () => ({ default: () => <div>topics-control</div> }));
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
  beforeEach(() => {
    useAppContext().isReadOnlyAdmin = false;
    vi.clearAllMocks();
  });

  test('places read-only Version before Maintainer in the metadata row', () => {
    const asset = {
      ...baseAsset,
      _metadata: {
        name: 'app-1',
        path: 'public/app-1__stable',
        folderId: 'public/',
        version: 'stable',
        author: 'Maintainer',
      },
    };
    render(<ApplicationAssetProperties asset={asset} onChange={vi.fn()} />);
    const versionLabel = screen.getByText(EntityFieldsI18nKey.version);
    const maintainerLabel = screen.getByText(EntityFieldsI18nKey.author);
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(versionLabel.compareDocumentPosition(maintainerLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: /EntityFields.version/ })).toBeNull();
  });

  test('edits and clears display version without changing path identity', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const asset = {
      ...baseAsset,
      folderId: 'public/',
      display_version: 'Spring release',
      _metadata: { version: 'stable' },
    } as DialApplicationResource;
    render(<ApplicationAssetProperties asset={asset} onChange={onChange} />);

    const control = screen.getByRole('textbox', { name: EntityFieldsI18nKey.displayVersion });
    expect(control).toHaveValue('Spring release');
    await user.clear(control);
    expect(onChange).toHaveBeenLastCalledWith({ ...asset, display_version: '' });
  });

  test('keeps display version labels associated with distinct inputs across property panels', () => {
    const asset = { ...baseAsset, folderId: 'public/' };
    render(
      <>
        <ApplicationAssetProperties asset={asset} onChange={vi.fn()} />
        <ApplicationAssetProperties asset={asset} onChange={vi.fn()} />
      </>,
    );

    const controls = screen.getAllByRole('textbox', { name: EntityFieldsI18nKey.displayVersion });
    expect(controls).toHaveLength(2);
    expect(controls[0].id).not.toBe('');
    expect(controls[1].id).not.toBe(controls[0].id);
  });

  test('disables display version for a read-only administrator', () => {
    useAppContext().isReadOnlyAdmin = true;
    render(<ApplicationAssetProperties asset={{ ...baseAsset, folderId: 'public/' }} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: EntityFieldsI18nKey.displayVersion })).toBeDisabled();
  });

  test('hides display version for platform resources and publications', () => {
    const { rerender } = render(
      <ApplicationAssetProperties asset={{ ...baseAsset, folderId: 'platform/' }} onChange={vi.fn()} />,
    );
    expect(screen.queryByRole('textbox', { name: EntityFieldsI18nKey.displayVersion })).toBeNull();
    rerender(<ApplicationAssetProperties asset={baseAsset} onChange={vi.fn()} isPublication />);
    expect(screen.queryByRole('textbox', { name: EntityFieldsI18nKey.displayVersion })).toBeNull();
  });

  test('validates publication Version as text against the target folder', () => {
    render(
      <ApplicationAssetProperties
        asset={{ ...baseAsset, _metadata: { version: 'release candidate' } } as DialApplicationResource}
        onChange={vi.fn()}
        isPublication
        publicationFolderId="public/target/"
      />,
    );
    expect(screen.getByRole('textbox', { name: /EntityFields.version/ })).toHaveValue('release candidate');
    expect(screen.getByRole('textbox', { name: /EntityFields.version/ })).not.toHaveAttribute('aria-invalid', 'true');
  });
  test('revalidates publication destination against the target rather than review folder', () => {
    const asset = {
      ...baseAsset,
      _metadata: { folderId: 'public/review/', version: 'stable' },
    } as DialApplicationResource;
    const { rerender } = render(
      <ApplicationAssetProperties
        asset={asset}
        onChange={vi.fn()}
        isPublication
        publicationFolderId="public/target/"
      />,
    );
    expect(screen.queryByText(ErrorI18nKey.InvalidAssetPath)).toBeNull();
    rerender(
      <ApplicationAssetProperties
        asset={asset}
        onChange={vi.fn()}
        isPublication
        publicationFolderId="public/invalid./"
      />,
    );
    expect(screen.getByText(ErrorI18nKey.InvalidAssetPath)).toBeInTheDocument();
  });

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

    expect(screen.getByRole('textbox', { name: /EntityFields.version/ })).toHaveValue('1.0.0');
  });

  test('writes an edited publication version to _metadata.version and display_version', () => {
    const onChange = vi.fn();
    const asset = { ...baseAsset, _metadata: { name: 'app-1', version: '1.0.0' } } as DialApplicationResource;
    render(<ApplicationAssetProperties asset={asset} onChange={onChange} isPublication />);

    fireEvent.change(screen.getByRole('textbox', { name: /EntityFields.version/ }), {
      target: { value: 'release candidate' },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        display_version: 'release candidate',
        _metadata: expect.objectContaining({ name: 'app-1', version: 'release candidate' }),
      }),
    );
  });

  test('does not render the version control outside a publication', () => {
    render(<ApplicationAssetProperties asset={baseAsset} onChange={vi.fn()} />);

    expect(screen.queryByRole('textbox', { name: /EntityFields.version/ })).toBeNull();
  });

  test('renders a default headers editor', () => {
    render(<ApplicationAssetProperties asset={baseAsset} onChange={vi.fn()} />);

    expect(screen.getByText(`key-value-grid: ${EntityFieldsI18nKey.defaultHeaders}`)).toBeInTheDocument();
  });
});
