import { describe, test, expect } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { generateUniqueName, getCustomToolErrorType } from './utils';

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
