import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import FoldersStorageLabel from '../FolderStorage';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialResource } from '@/src/models/dial/resource';

const baseAsset = { name: 'asset-1' } as DialResource;

describe('FoldersStorageLabel', () => {
  test('renders the platform bucket name with no open-in-new-tab button for a platform-bucket asset', () => {
    render(<FoldersStorageLabel asset={{ ...baseAsset, folderId: 'platform/' }} />);

    expect(screen.getByText(EntitiesI18nKey.FolderStorage)).toBeInTheDocument();
    expect(screen.getByText('platform')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders the folder path with an open-in-new-tab button for a public-bucket asset', () => {
    render(<FoldersStorageLabel asset={{ ...baseAsset, folderId: 'public/sub/' }} />);

    expect(screen.getByText('public/sub')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('renders nothing for an asset with no folderId', () => {
    render(<FoldersStorageLabel asset={{ ...baseAsset, folderId: '' }} />);

    expect(screen.queryByText(EntitiesI18nKey.FolderStorage)).not.toBeInTheDocument();
  });
});
