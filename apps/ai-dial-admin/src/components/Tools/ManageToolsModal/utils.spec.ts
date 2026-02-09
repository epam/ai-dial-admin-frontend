import { describe, test, expect } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { generateUniqueName, getCustomToolErrorType, getToggledToolsConfig } from './utils';
import { CustomToolConfig } from './types';

describe('generateUniqueName', () => {
  const defaultName = 'Untitled';

  test('returns default name if array of names is empty', () => {
    const result = generateUniqueName([], defaultName);
    expect(result).toEqual(defaultName);
  });
  test('returns default name with counter if array of names includes default name', () => {
    const result = generateUniqueName([defaultName], defaultName);
    expect(result).toEqual(`${defaultName}-2`);
  });
  test('returns the default name with a unique counter that is not in the names array', () => {
    const result = generateUniqueName([defaultName, `${defaultName}-2`, 'test', `${defaultName}-3`], defaultName);
    expect(result).toEqual(`${defaultName}-4`);
  });
});

describe('getCustomToolErrorType', () => {
  test('returns null if tool name valid', () => {
    const toolName = '2';
    const allTools = ['1', '2', '3', '4'];
    const result = getCustomToolErrorType(toolName, allTools);
    expect(result).toEqual(null);
  });
  test('returns ErrorType.EMPTY if tool name is empty', () => {
    const toolName = '';
    const allTools = ['1', '2', '3', '4', ''];
    const result = getCustomToolErrorType(toolName, allTools);
    expect(result).toEqual(ErrorType.EMPTY);
  });
  test('returns ErrorType.EXISTING if tool name not unique', () => {
    const toolName = '1';
    const allTools = ['1', '2', '3', '4', '1'];
    const result = getCustomToolErrorType(toolName, allTools);
    expect(result).toEqual(ErrorType.EXISTING);
  });
});

describe('getToggledToolsConfig', () => {
  test('should toggle target item', () => {
    const items = [
      {
        id: '1',
        name: 'tool1',
        isAllowed: true,
        error: null,
      },
      {
        id: '2',
        name: 'tool2',
        isAllowed: true,
        error: null,
      },
      {
        id: '3',
        name: 'tool3',
        isAllowed: true,
        error: null,
      },
    ];
    const filteredItems = [
      {
        id: '2',
        name: 'tool2',
        isAllowed: true,
        error: null,
      },
    ];
    const index = 0;
    const result = getToggledToolsConfig(items, filteredItems, index);
    expect(result[1].isAllowed).toBe(false);
  });
  test('Should leave the same value if item does not exist', () => {
    const items = [
      {
        id: '1',
        name: 'tool1',
        isAllowed: true,
        error: null,
      },
    ];
    const filteredItems = [] as CustomToolConfig[];
    const index = 4;
    const result = getToggledToolsConfig(items, filteredItems, index);
    expect(result).toEqual(items);
  });

  test('Should return empty array if no items', () => {
    const items = [] as CustomToolConfig[];
    const filteredItems = [] as CustomToolConfig[];
    const index = -1;
    const result = getToggledToolsConfig(items, filteredItems, index);
    expect(result).toEqual(items);
  });
});
