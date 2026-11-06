import { DialFileNodeType } from '@epam/ai-dial-react-file-manager';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

const { windowOpen, fetchedFoldersData, lastProps } = vi.hoisted(() => ({
  windowOpen: vi.fn(),
  fetchedFoldersData: {} as Record<string, unknown[]>,
  lastProps: { value: null as null | Record<string, unknown> },
}));

const item = {
  name: 'MyApp',
  path: 'public/folder/MyApp__1.0',
  folderId: 'public/folder/',
  version: '1.0',
  nodeType: DialFileNodeType.ITEM,
};

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: () => ({
    fetchFiles: vi.fn(),
    filePath: 'file/',
    fetchedFoldersData,
    setFilePath: vi.fn(),
  }),
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    lastProps.value = props;
    return <button onClick={() => (props.onOpenInNewTab as (file: unknown) => void)(item)}>open-in-new-tab</button>;
  },
}));

vi.mock('../Modals', () => ({ __esModule: true, default: () => null }));

const CONFIG_FILE_URL = '/assets-applications/MyApp?path=public%2Ffolder%2FMyApp__1.0&configFile=true';

const renderNameCell = () => {
  const columns = lastProps.value?.columnDefs as Array<(...args: unknown[]) => ColDef>;
  const nameColumn = columns[0](undefined, undefined, false);
  const cellRenderer = nameColumn.cellRenderer as (params: ICellRendererParams) => React.ReactNode;
  return render(<>{cellRenderer({ data: item, context: {} } as unknown as ICellRendererParams)}</>);
};

describe('BaseAssetList config-file navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', windowOpen);
  });

  test('links a config-file asset name to its details with the path query preserved', () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);
    renderNameCell();

    expect(screen.getByRole('link', { name: 'MyApp' })).toHaveAttribute('href', CONFIG_FILE_URL);
  });

  test('does not open details on a file-row click', () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    expect(lastProps.value?.onTableFileClick).toBeUndefined();
  });

  test('opens the corrected URL through the action-menu new-tab callback', async () => {
    const user = userEvent.setup();
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    await user.click(screen.getByRole('button', { name: 'open-in-new-tab' }));

    expect(windowOpen).toHaveBeenCalledWith(CONFIG_FILE_URL, '_blank');
  });
});
