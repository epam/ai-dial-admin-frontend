import { describe, expect, test } from 'vitest';
import { getGridDataFromImportPreview } from './utils';
import { ImportPreview } from './models';

describe('getGridDataFromImportPreview', () => {
  test('should map detectedColumns to colDefs correctly', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [
        { fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' },
        { fieldName: 'age', headerName: 'Age', inferredType: 'number', mappedTo: 'facts.age' },
      ],
      sampleRows: [],
      totalRows: 0,
      warnings: [],
      autoDetectedSchema: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.colDefs[0]).toEqual({ field: 'name', headerName: 'Name' });
    expect(result.colDefs[1]).toEqual({ field: 'age', headerName: 'Age' });
  });

  test('should map sampleRows with facts and parameters to rowData correctly', () => {
    const importPreview: ImportPreview = {
      autoDetectedSchema: [],
      detectedColumns: [{ fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' }],
      sampleRows: [
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 1',
          data: { temperature: 0.7, model: 'gpt-4' },
          validationWarnings: [],
        },
        {
          enabled: false,
          valid: true,
          testCaseName: 'Test Case 2',
          data: { temperature: 0.5 },
          validationWarnings: [],
        },
      ],
      totalRows: 2,
      warnings: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.rowData).toEqual([
      {
        enabled: true,
        valid: true,
        testCaseName: 'Test Case 1',
        data: { temperature: 0.7, model: 'gpt-4' },
        validationWarnings: [],
        temperature: 0.7,
        model: 'gpt-4',
      },
      {
        enabled: false,
        valid: true,
        testCaseName: 'Test Case 2',
        data: { temperature: 0.5 },
        validationWarnings: [],
        temperature: 0.5,
      },
    ]);
  });

  test('should handle empty detectedColumns', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [],
      sampleRows: [],
      totalRows: 0,
      warnings: [],
      autoDetectedSchema: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.rowData).toEqual([]);
  });

  test('should handle empty sampleRows', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [{ fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' }],
      sampleRows: [],
      totalRows: 0,
      warnings: [],
      autoDetectedSchema: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.colDefs[0]).toEqual({ field: 'name', headerName: 'Name' });
    expect(result.rowData).toEqual([]);
  });

  test('should handle rows with empty facts and parameters', () => {
    const importPreview: ImportPreview = {
      autoDetectedSchema: [],
      detectedColumns: [{ fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' }],
      sampleRows: [
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 1',
          data: {},
          validationWarnings: [],
        },
      ],
      totalRows: 1,
      warnings: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.rowData).toEqual([
      {
        enabled: true,
        valid: true,
        testCaseName: 'Test Case 1',
        data: {},
        validationWarnings: [],
      },
    ]);
  });

  test('should correctly spread row properties when facts and parameters have same keys', () => {
    const importPreview: ImportPreview = {
      autoDetectedSchema: [],
      detectedColumns: [],
      sampleRows: [
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 1',
          data: { value: 100 },
          validationWarnings: [],
        },
      ],
      totalRows: 1,
      warnings: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    // data.value should be correctly mapped
    expect((result.rowData[0] as any).value).toBe(100);
  });
});
