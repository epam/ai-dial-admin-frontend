import { describe, expect, test } from 'vitest';
import { getNameExtensionFromFile } from '../get-extension';

describe('Files list :: getNameExtensionFromFile', () => {
  test('Should return name and extension', () => {
    const res = getNameExtensionFromFile('file.jpg');
    expect(res).toEqual({ name: 'file', extension: '.jpg' });
  });

  test('Should return name', () => {
    const res = getNameExtensionFromFile('file');
    expect(res).toEqual({ name: 'file', extension: '' });
  });
});
