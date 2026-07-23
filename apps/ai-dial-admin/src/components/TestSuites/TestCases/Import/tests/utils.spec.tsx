import { describe, expect, test } from 'vitest';
import { getGridDataFromImportPreview } from '@/src/components/TestSuites/TestCases/Import/utils';
import { ImportPreview } from '@/src/components/TestSuites/TestCases/Import/models';

describe('getGridDataFromImportPreview - turnIndex', () => {
  test('renders a turnIndex column and keeps turnIndex top-level, out of data', () => {
    const importPreview: ImportPreview = {
      autoDetectedSchema: [],
      detectedColumns: [
        { fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' },
        { fieldName: 'turnIndex', headerName: 'Turn Index', inferredType: 'number', mappedTo: 'turnIndex' },
      ],
      sampleRows: [
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 1',
          turnIndex: 0,
          data: { temperature: 0.7 },
          validationWarnings: [],
        },
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 2',
          turnIndex: 1,
          data: { temperature: 0.5 },
          validationWarnings: [],
        },
      ],
      totalRows: 2,
      warnings: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.colDefs).toContainEqual({ field: 'turnIndex', headerName: 'Turn Index' });

    result.rowData.forEach((row, index) => {
      expect((row as { turnIndex?: number | null }).turnIndex).toBe(importPreview.sampleRows[index].turnIndex);
      expect((row as { data: Record<string, unknown> }).data).not.toHaveProperty('turnIndex');
    });
  });
});
