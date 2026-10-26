import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { CustomFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { CustomFileRowData } from '@/src/utils/files/grid-data';

const getFiles = vi.fn();
const uploadFiles = vi.fn();
const removeFile = vi.fn();
const exportFile = vi.fn();
const onChangeSelectedFilePath = vi.fn();

vi.mock('@/src/components/Common/FileSelectInput/constants', () => ({
  getEntityFileActions: () => ({ getFiles, uploadFiles, removeFile }),
}));

vi.mock('@/src/hooks/use-application-file-export', () => ({
  useApplicationFileExport: () => exportFile,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  FileIcon: () => null,
  Spinner: () => <div>loader</div>,
}));

vi.mock('@/src/components/Common/FileUploadField/FileUploadField', () => ({
  default: () => <div>upload-area</div>,
}));

vi.mock('@epam/ai-dial-react-file-manager', () => ({
  SIZE_COLUMN: () => ({ field: 'contentLength', headerName: 'Size' }),
}));

type MockColDef = {
  field?: string;
  colId?: string;
  cellRendererParams?: {
    items?: { id: string; onClick: (data?: CustomFileRowData) => void }[];
  };
};

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    columnDefs,
    additionalGridOptions,
  }: {
    rowData?: CustomFileRowData[];
    columnDefs?: MockColDef[];
    additionalGridOptions?: {
      onCellClicked: (e: {
        column: { getColId: () => string };
        node: { setSelected: (selected: boolean) => void };
      }) => void;
    };
  }) => {
    const actions = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    const setSelected = vi.fn();

    const clickColumn = (colId: string) =>
      additionalGridOptions?.onCellClicked({
        column: { getColId: () => colId },
        node: { setSelected },
      });

    return (
      <div>
        <div>{`action-ids: ${actions.map((item) => item.id).join('|')}`}</div>
        {rowData?.map((row) => (
          <div key={row.path} role="group" aria-label={`row-${row.displayName}`}>
            <button type="button" onClick={() => clickColumn('displayName')}>
              {`select-${row.displayName}`}
            </button>
            <button type="button" onClick={() => clickColumn(ACTIONS_COLUMN_CEL_ID)}>
              {`click-actions-${row.displayName}`}
            </button>
            {actions.map((item) => (
              <button key={item.id} type="button" onClick={() => item.onClick(row)}>
                {`${item.id}:${row.displayName}`}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

import ApplicationFileManager from '../ApplicationFileManager';

const FILES: CustomFile[] = [
  {
    path: 'files/@ef/suites/suite-1/report.pdf',
    filename: 'report.pdf',
    contentType: 'application/pdf',
    sizeBytes: 12,
  },
];

describe('ApplicationFileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFiles.mockResolvedValue(FILES);
    removeFile.mockResolvedValue({ success: true });
  });

  test('exposes Export and Delete row actions', async () => {
    render(
      <ApplicationFileManager
        id="suite-1"
        view={ApplicationRoute.TestSuites}
        selectedFilePath={null}
        onChangeSelectedFilePath={onChangeSelectedFilePath}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(`action-ids: ${ActionMenuOperationI18nKey.Export}|${ActionMenuOperationI18nKey.Delete}`),
      ).toBeInTheDocument();
    });
  });

  test('does not change selection when the actions column is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ApplicationFileManager
        id="suite-1"
        view={ApplicationRoute.TestSuites}
        selectedFilePath={null}
        onChangeSelectedFilePath={onChangeSelectedFilePath}
      />,
    );

    await waitFor(() => expect(screen.getByRole('group', { name: 'row-report.pdf' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'click-actions-report.pdf' }));

    expect(onChangeSelectedFilePath).not.toHaveBeenCalled();
  });

  test('exports the file without changing selection', async () => {
    const user = userEvent.setup();

    render(
      <ApplicationFileManager
        id="suite-1"
        view={ApplicationRoute.TestSuites}
        selectedFilePath={null}
        onChangeSelectedFilePath={onChangeSelectedFilePath}
      />,
    );

    await waitFor(() => expect(screen.getByRole('group', { name: 'row-report.pdf' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Export}:report.pdf` }));

    expect(exportFile).toHaveBeenCalledWith('suite-1', 'report.pdf');
    expect(onChangeSelectedFilePath).not.toHaveBeenCalled();
  });
});
