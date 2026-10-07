import { DialFileNodeType } from '@epam/ai-dial-react-file-manager';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { getAssetNameColumn } from '../utils';

const column = (): ColDef => getAssetNameColumn('Name')(undefined, undefined, false);

// ui-kit's own renderer reads the grid `context` without guarding it, so every row needs one — the
// FileManager always supplies it in the app.
const params = (data: Record<string, unknown>): ICellRendererParams =>
  ({ data, context: {} }) as unknown as ICellRendererParams;

const renderCell = (data: Record<string, unknown>) => {
  const cellRenderer = column().cellRenderer as (p: ICellRendererParams) => React.ReactNode;
  return render(<>{cellRenderer(params(data))}</>);
};

describe('getAssetNameColumn', () => {
  test('identifies itself as the FileManager name column, so ui-kit keeps its inline editors usable', () => {
    expect(column()).toMatchObject({ colId: 'name', field: 'name', headerName: 'Name' });
  });

  test('renders a folder row through the file manager, which gives it a folder icon instead of a letter avatar', () => {
    const { container } = renderCell({
      name: 'shared-prompts',
      path: 'public/shared-prompts',
      nodeType: DialFileNodeType.FOLDER,
    });

    expect(screen.getByText('shared-prompts')).toBeInTheDocument();
    expect(container.querySelector('.dial-kit-folder-name .dial-kit-file-icon svg')).toBeInTheDocument();
  });

  test('keeps the display-name presentation for an asset row, id sub-line included', () => {
    renderCell({
      name: 'summarize-text',
      displayName: 'Summarize text',
      path: 'public/summarize-text',
      nodeType: DialFileNodeType.ITEM,
    });

    expect(screen.getByText('Summarize text')).toBeInTheDocument();
    expect(screen.getByText('summarize-text')).toBeInTheDocument();
  });

  test('sorts and filters on the label the row actually shows', () => {
    const { valueGetter, filterValueGetter } = column();
    const row = { data: { name: 'summarize-text', displayName: 'Summarize text' } };

    expect((valueGetter as (p: unknown) => unknown)(row)).toBe('Summarize text');
    expect((filterValueGetter as (p: unknown) => unknown)(row)).toBe('Summarize text summarize-text');
  });
});
