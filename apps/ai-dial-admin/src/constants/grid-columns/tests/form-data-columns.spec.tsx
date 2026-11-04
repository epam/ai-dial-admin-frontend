import { describe, expect, test, vi } from 'vitest';

import { ICellRendererParams } from 'ag-grid-community';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import FileSelectCellRenderer from '@/src/components/Grid/CellRenderers/FileSelectCellRenderer';
import { FormDataPart, FormDataType } from '@/src/models/form-data';
import { getFormDataColumns } from '../grid-columns';

describe('getFormDataColumns', () => {
  const [, typeColumn, valueColumn] = getFormDataColumns(vi.fn(), 'suite-1');

  const selectRenderer = (type: FormDataType) =>
    valueColumn.cellRendererSelector?.({
      data: { name: 'part', type, value: '' },
    } as ICellRendererParams<FormDataPart>);

  test('offers only text and file part types', () => {
    expect(typeColumn.cellRendererParams.items).toEqual([
      { value: FormDataType.Text, label: 'Text' },
      { value: FormDataType.File, label: 'File' },
    ]);
  });

  test.each([
    [FormDataType.Text, EditableCellRenderer],
    [FormDataType.File, FileSelectCellRenderer],
  ])('renders the type-driven value editor for a %s part', (type, expected) => {
    expect(selectRenderer(type)?.component).toBe(expected);
  });
});
