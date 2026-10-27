import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import FileSelectCellRenderer from '@/src/components/Grid/CellRenderers/FileSelectCellRenderer';
import SkillSelectCellRenderer from '@/src/components/Grid/CellRenderers/SkillSelectCellRenderer';
import { InputBindingRowData } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import { getDynamicConfigurationsColumns, getVariablesColumns } from '../columns';

const selectValueRenderer = (columns: ColDef<InputBindingRowData>[], effectiveType: TestCaseItemType) => {
  const valueColumn = columns.find((column) => column.field === 'value');

  return valueColumn?.cellRendererSelector?.({
    data: { templateVariable: 'var', effectiveType },
  } as ICellRendererParams<InputBindingRowData>);
};

describe('getDynamicConfigurationsColumns — reference value editors', () => {
  const columns = getDynamicConfigurationsColumns(vi.fn(), vi.fn(), [], 'suite-1', (key) => key);

  test('edits a FILE value with the file picker scoped to the suite', () => {
    const selected = selectValueRenderer(columns, TestCaseItemType.FILE);

    expect(selected?.component).toBe(FileSelectCellRenderer);
    expect(selected?.params).toEqual(expect.objectContaining({ id: 'suite-1', view: ApplicationRoute.TestSuites }));
  });

  test('edits a SKILL value with the skill picker', () => {
    const selected = selectValueRenderer(columns, TestCaseItemType.SKILL);

    expect(selected?.component).toBe(SkillSelectCellRenderer);
    expect(selected?.params).toEqual(expect.objectContaining({ onChange: expect.any(Function) }));
  });

  test('keeps the text editor for a STRING value', () => {
    expect(selectValueRenderer(columns, TestCaseItemType.STRING)?.component).toBe(EditableCellRenderer);
  });
});

describe('getVariablesColumns — reference value editors', () => {
  const columns = getVariablesColumns(vi.fn(), 'suite-1');

  test('edits a FILE value with the file picker scoped to the suite', () => {
    const selected = selectValueRenderer(columns, TestCaseItemType.FILE);

    expect(selected?.component).toBe(FileSelectCellRenderer);
    expect(selected?.params).toEqual(expect.objectContaining({ id: 'suite-1', view: ApplicationRoute.TestSuites }));
  });

  test('edits a SKILL value with the skill picker', () => {
    const selected = selectValueRenderer(columns, TestCaseItemType.SKILL);

    expect(selected?.component).toBe(SkillSelectCellRenderer);
  });

  test('keeps the text editor for a STRING value', () => {
    expect(selectValueRenderer(columns, TestCaseItemType.STRING)?.component).toBe(EditableCellRenderer);
  });
});
