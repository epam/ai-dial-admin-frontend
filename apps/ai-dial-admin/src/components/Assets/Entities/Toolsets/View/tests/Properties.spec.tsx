import { beforeEach, describe, expect, test, vi } from 'vitest';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ToolsetAssetProperties from '@/src/components/Assets/Entities/Toolsets/View/Properties';
import { DialToolsetResource } from '@/src/models/dial/resource';

vi.mock('@/src/components/Assets/Header/FolderStorage', () => ({ default: () => <div>folders-storage-label</div> }));
vi.mock('@/src/components/Assets/Resources/Auth/ResourceAuthHeader', () => ({
  default: () => <div>resource-auth-header</div>,
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
  beforeEach(() => {
    useAppContext().isReadOnlyAdmin = false;
    vi.clearAllMocks();
  });

  test('places read-only Version before Maintainer in the metadata row', () => {
    const toolset = {
      ...baseToolset,
      _metadata: {
        name: 'toolset-1',
        path: 'public/toolset-1__stable',
        folderId: 'public/',
        version: 'stable',
        author: 'Maintainer',
      },
    };
    render(<ToolsetAssetProperties selectedToolset={toolset} onChange={vi.fn()} />);
    const versionLabel = screen.getByText(EntityFieldsI18nKey.version);
    const maintainerLabel = screen.getByText(EntityFieldsI18nKey.author);
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(versionLabel.compareDocumentPosition(maintainerLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: /EntityFields.version/ })).toBeNull();
  });

  test('edits and clears display version without changing path identity', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const toolset = {
      ...baseToolset,
      folderId: 'public/',
      display_version: 'Spring release',
      _metadata: { version: 'stable' },
    } as DialToolsetResource;
    render(<ToolsetAssetProperties selectedToolset={toolset} onChange={onChange} />);
    const control = screen.getByRole('textbox', { name: EntityFieldsI18nKey.displayVersion });
    expect(control).toHaveValue('Spring release');
    await user.clear(control);
    expect(onChange).toHaveBeenLastCalledWith({ ...toolset, display_version: '' });
  });

  test('disables display version for a read-only administrator', () => {
    useAppContext().isReadOnlyAdmin = true;
    render(<ToolsetAssetProperties selectedToolset={{ ...baseToolset, folderId: 'public/' }} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: EntityFieldsI18nKey.displayVersion })).toBeDisabled();
  });

  test('hides display version for platform resources and publications', () => {
    const { rerender } = render(
      <ToolsetAssetProperties selectedToolset={{ ...baseToolset, folderId: 'platform/' }} onChange={vi.fn()} />,
    );
    expect(screen.queryByRole('textbox', { name: EntityFieldsI18nKey.displayVersion })).toBeNull();
    rerender(<ToolsetAssetProperties selectedToolset={baseToolset} onChange={vi.fn()} isPublication />);
    expect(screen.queryByRole('textbox', { name: EntityFieldsI18nKey.displayVersion })).toBeNull();
  });

  test('validates publication Version as text against the target folder', () => {
    render(
      <ToolsetAssetProperties
        selectedToolset={{ ...baseToolset, _metadata: { version: 'release candidate' } } as DialToolsetResource}
        onChange={vi.fn()}
        isPublication
        publicationFolderId="public/target/"
      />,
    );
    expect(screen.getByRole('textbox', { name: /EntityFields.version/ })).toHaveValue('release candidate');
    expect(screen.getByRole('textbox', { name: /EntityFields.version/ })).not.toHaveAttribute('aria-invalid', 'true');
  });
  test('revalidates publication destination against the target rather than review folder', () => {
    const toolset = {
      ...baseToolset,
      _metadata: { folderId: 'public/review/', version: 'stable' },
    } as DialToolsetResource;
    const { rerender } = render(
      <ToolsetAssetProperties
        selectedToolset={toolset}
        onChange={vi.fn()}
        isPublication
        publicationFolderId="public/target/"
      />,
    );
    expect(screen.queryByText(ErrorI18nKey.InvalidAssetPath)).toBeNull();
    rerender(
      <ToolsetAssetProperties
        selectedToolset={toolset}
        onChange={vi.fn()}
        isPublication
        publicationFolderId="public/invalid./"
      />,
    );
    expect(screen.getByText(ErrorI18nKey.InvalidAssetPath)).toBeInTheDocument();
  });

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

  test('renders the folder-move control for a public-bucket toolset', () => {
    render(<ToolsetAssetProperties selectedToolset={{ ...baseToolset, folderId: 'public/' }} onChange={vi.fn()} />);

    expect(screen.getByText('file-path')).toBeInTheDocument();
  });

  test('hides the folder-move control for a platform-bucket toolset — the bucket has no folders', () => {
    render(<ToolsetAssetProperties selectedToolset={{ ...baseToolset, folderId: 'platform/' }} onChange={vi.fn()} />);

    expect(screen.queryByText('file-path')).not.toBeInTheDocument();
  });

  test('shows the publication version from _metadata.version', () => {
    const toolset = { ...baseToolset, _metadata: { version: '1.0.0' } } as DialToolsetResource;
    render(<ToolsetAssetProperties selectedToolset={toolset} onChange={vi.fn()} isPublication />);

    expect(screen.getByRole('textbox', { name: /EntityFields.version/ })).toHaveValue('1.0.0');
  });

  test('writes an edited publication version to _metadata.version and display_version', () => {
    const onChange = vi.fn();
    const toolset = { ...baseToolset, _metadata: { name: 'toolset-1', version: '1.0.0' } } as DialToolsetResource;
    render(<ToolsetAssetProperties selectedToolset={toolset} onChange={onChange} isPublication />);

    fireEvent.change(screen.getByRole('textbox', { name: /EntityFields.version/ }), {
      target: { value: 'release candidate' },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        display_version: 'release candidate',
        _metadata: expect.objectContaining({ name: 'toolset-1', version: 'release candidate' }),
      }),
    );
  });

  test('does not render the version control outside a publication', () => {
    render(<ToolsetAssetProperties selectedToolset={baseToolset} onChange={vi.fn()} />);

    expect(screen.queryByRole('textbox', { name: /EntityFields.version/ })).toBeNull();
  });
});
