import { DialPrompt } from '../../models/dial/prompt';
import {
  checkNameVersionCombination,
  getVersionsPerName,
  filterLatestVersions,
  getInitialVersion,
  generateNameVersionForPrompt,
  getNameVersionFromPrompt,
  modifyNameVersionInPrompt,
} from './prompts-list';
import { describe, expect, test } from 'vitest';

describe('Prompts list :: generateNameVersionForPrompt', () => {
  test('Should return name + version', () => {
    const res = generateNameVersionForPrompt('prompt', '1.0.0');
    expect(res).toEqual('prompt__1.0.0');
  });
});

describe('Prompts list :: getNameVersionFromPrompt', () => {
  test('Should return name and version', () => {
    const res = getNameVersionFromPrompt('prompt__1.0.0');
    expect(res).toEqual({ name: 'prompt', version: '1.0.0' });
  });

  test('Should return name', () => {
    const res = getNameVersionFromPrompt('prompt1.0.0');
    expect(res).toEqual({ name: 'prompt1.0.0', version: '' });
  });
});

describe('Prompts list :: modifyNameVersionInPrompt', () => {
  test('Should return name and changed version', () => {
    const res = modifyNameVersionInPrompt('prompt__1.0.0', void 0, '2.0.0');
    expect(res).toEqual('prompt__2.0.0');
  });

  test('Should return changed name and version', () => {
    const res = modifyNameVersionInPrompt('prompt__1.0.0', 'newName');
    expect(res).toEqual('newName__1.0.0');
  });

  test('Should return changed name and changed version', () => {
    const res = modifyNameVersionInPrompt('prompt__1.0.0', 'newName', '3.0.0');
    expect(res).toEqual('newName__3.0.0');
  });

  test('Should return changed name', () => {
    const res = modifyNameVersionInPrompt('prompt1.0.0', 'newName');
    expect(res).toEqual('newName');
  });

  test('Should add version to name', () => {
    const res = modifyNameVersionInPrompt('prompt1.0.0', 'newName', '2.0.0');
    expect(res).toEqual('newName__2.0.0');
  });

  test('Should change name in path', () => {
    const res = modifyNameVersionInPrompt('prompts/public/Test__1.0.0', 'NewName');
    expect(res).toEqual('prompts/public/NewName__1.0.0');
  });

  test('Should change version in path', () => {
    const res = modifyNameVersionInPrompt('prompts/public/Test__1.0.0', undefined, '2.0.0');
    expect(res).toEqual('prompts/public/Test__2.0.0');
  });

  test('Should change both name and version in path', () => {
    const res = modifyNameVersionInPrompt('prompts/public/Test__1.0.0', 'FinalName', '3.0.0');
    expect(res).toEqual('prompts/public/FinalName__3.0.0');
  });

  test('Should handle path with no version', () => {
    const res = modifyNameVersionInPrompt('prompts/public/JustName', undefined, '1.0.0');
    expect(res).toEqual('prompts/public/JustName__1.0.0');
  });

  test('Should handle path with name change but no version present', () => {
    const res = modifyNameVersionInPrompt('prompts/public/JustName', 'Renamed');
    expect(res).toEqual('prompts/public/Renamed');
  });
});

describe('Prompts list :: getInitialVersion', () => {
  test('Should return latest version + 1', () => {
    const res = getInitialVersion({ versions: ['1.0.1', '1.0.2', '1.0.3'] }, 'versions');
    expect(res).toEqual('1.0.4');
  });
});

describe('Prompts list :: checkNameVersionCombination', () => {
  test('Should return false if no such prompt name', () => {
    const res = checkNameVersionCombination({ prompt: ['1', '2'] }, 'name', '1');
    expect(res).toBeFalsy();
  });
  test('Should return false if no such version for existed name', () => {
    const res = checkNameVersionCombination({ name: ['1', '2'] }, 'name', '3');
    expect(res).toBeFalsy();
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
