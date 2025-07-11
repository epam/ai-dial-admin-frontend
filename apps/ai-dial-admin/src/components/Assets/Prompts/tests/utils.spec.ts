import { describe, expect, test } from 'vitest';
import { filterLatestVersions, getVersionsPerName } from '../utils';
import { DialPrompt } from '@/src/models/dial/prompt';

describe('Prompts list :: filterLatestVersions', () => {
  test('Should return only latest versions', () => {
    const res = filterLatestVersions([
      { name: 'prompts', version: '7' },
      { name: 'prompts', version: '4' },
      { name: 'addon', version: '3' },
      { name: 'addon', version: '1' },
      { name: 'model', version: '1' },
      { name: 'prompts', version: '1' },
    ] as DialPrompt[]);
    expect(res).toEqual([
      { name: 'prompts', version: '7' },
      { name: 'addon', version: '3' },
      { name: 'model', version: '1' },
    ]);
  });
});

describe('Prompts list :: getVersionsPerName', () => {
  test('Should return correct map', () => {
    const res = getVersionsPerName([
      { name: 'prompts', version: '1' },
      { name: 'prompts', version: '2' },
    ] as DialPrompt[]);
    expect(res).toEqual({
      prompts: ['1', '2'],
    });
  });
  test('Should return correct map', () => {
    const res = getVersionsPerName([
      { name: 'prompts', version: '7' },
      { name: 'prompts', version: '4' },
      { name: 'addon', version: '3' },
      { name: 'addon', version: '1' },
      { name: 'model', version: '1' },
      { name: 'prompts', version: '1' },
    ] as DialPrompt[]);
    expect(res).toEqual({
      prompts: ['1', '4', '7'],
      addon: ['1', '3'],
      model: ['1'],
    });
  });
});

