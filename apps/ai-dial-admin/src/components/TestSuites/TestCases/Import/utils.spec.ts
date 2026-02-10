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
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.colDefs[0]).toEqual({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' });
    expect(result.colDefs[1]).toEqual({ field: 'name', headerName: 'Name' });
    expect(result.colDefs[2]).toEqual({ field: 'age', headerName: 'Age' });
  });

  test('should map sampleRows with facts and parameters to rowData correctly', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [{ fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' }],
      sampleRows: [
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 1',
          facts: { temperature: 0.7, model: 'gpt-4' },
          parameters: { maxTokens: 100, stream: true },
          validationWarnings: [],
        },
        {
          enabled: false,
          valid: true,
          testCaseName: 'Test Case 2',
          facts: { temperature: 0.5 },
          parameters: { maxTokens: 200 },
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
        facts: { temperature: 0.7, model: 'gpt-4' },
        parameters: { maxTokens: 100, stream: true },
        validationWarnings: [],
        temperature: 0.7,
        model: 'gpt-4',
        maxTokens: 100,
        stream: true,
      },
      {
        enabled: false,
        valid: true,
        testCaseName: 'Test Case 2',
        facts: { temperature: 0.5 },
        parameters: { maxTokens: 200 },
        validationWarnings: [],
        temperature: 0.5,
        maxTokens: 200,
      },
    ]);
  });

  test('should handle empty detectedColumns', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [],
      sampleRows: [],
      totalRows: 0,
      warnings: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.colDefs[0]).toEqual({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' });
    expect(result.rowData).toEqual([]);
  });

  test('should handle empty sampleRows', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [{ fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' }],
      sampleRows: [],
      totalRows: 0,
      warnings: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    expect(result.colDefs[1]).toEqual({ field: 'name', headerName: 'Name' });
    expect(result.rowData).toEqual([]);
  });

  test('should handle rows with empty facts and parameters', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [{ fieldName: 'name', headerName: 'Name', inferredType: 'string', mappedTo: 'testCaseName' }],
      sampleRows: [
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 1',
          facts: {},
          parameters: {},
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
        facts: {},
        parameters: {},
        validationWarnings: [],
      },
    ]);
  });

  test('should correctly spread row properties when facts and parameters have same keys', () => {
    const importPreview: ImportPreview = {
      detectedColumns: [],
      sampleRows: [
        {
          enabled: true,
          valid: true,
          testCaseName: 'Test Case 1',
          facts: { value: 100 },
          parameters: { value: 200 }, // Same key as facts
          validationWarnings: [],
        },
      ],
      totalRows: 1,
      warnings: [],
    };

    const result = getGridDataFromImportPreview(importPreview);

    // parameters.value should override facts.value due to spread order
    expect((result.rowData[0] as any).value).toBe(200);
  });
});
