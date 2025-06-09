import {
  generatePromptRowDataForExportGrid,
  changeExportFileData,
  changeExportPromptData,
  generateExportList,
} from './export';

describe('Prompts list :: generatePromptRowDataForExportGrid', () => {
  it('Should return similar data', () => {
    const prompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name2', version: '1.0.0' },
    ];
    const exportedPrompts = [];
    const res = generatePromptRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toEqual([
      { name: 'name1', version: '1.0.0', versions: ['1.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });
  it('Should return merged data', () => {
    const prompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name1', version: '2.0.0' },
      { name: 'name1', version: '3.0.0' },
      { name: 'name2', version: '1.0.0' },
    ];
    const exportedPrompts = [];
    const res = generatePromptRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toEqual([
      { name: 'name1', version: '3.0.0', versions: ['1.0.0', '2.0.0', '3.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });

  it('Should return merged data with versions if it already exported', () => {
    const prompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name1', version: '2.0.0' },
      { name: 'name1', version: '3.0.0' },
      { name: 'name2', version: '1.0.0' },
    ];
    const exportedPrompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name1', version: '2.0.0' },
    ];
    const res = generatePromptRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toEqual([
      { name: 'name1', version: '1.0.0, 2.0.0', versions: ['1.0.0', '2.0.0', '3.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });
});

describe('Prompts list :: changeExportFileData', () => {
  it('Should return object with new filePath if not exist', () => {
    const selected = [];
    const fetched = {};
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportFileData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [] });
  });
  it('Should return object with new filled data for filePath', () => {
    const selected = [{ name: 'name1', extension: '.jpg' }];
    const fetched = { filePath: [{ name: 'name1.jpg' }] };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportFileData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [{ name: 'name1.jpg' }] });
  });
});

describe('Prompts list :: changeExportPromptData', () => {
  it('Should return object with new filePath if not exist', () => {
    const selected = [];
    const fetched = {};
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportPromptData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [] });
  });
  it('Should return object with new filled data for filePath', () => {
    const selected = [{ name: 'name1', version: '1.0.0' }];
    const fetched = { filePath: [{ name: 'name1', version: '1.0.0' }] };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportPromptData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [{ name: 'name1', version: '1.0.0' }] });
  });
  it('Should return filtered object with data for filePath', () => {
    const selected = [{ name: 'name1', version: '1.0.0, 2.0.0, 3.0.0' }];
    const fetched = {
      filePath: [
        { name: 'name1', version: '1.0.0' },
        { name: 'name1', version: '2.0.0' },
        { name: 'name1', version: '3.0.0' },
        { name: 'name2', version: '1.0.0' },
      ],
    };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportPromptData(selected, fetched, filePath, exported);
    expect(res).toEqual({
      filePath: [
        { name: 'name1', version: '1.0.0' },
        { name: 'name1', version: '2.0.0' },
        { name: 'name1', version: '3.0.0' },
      ],
    });
  });
});

describe('Prompts list :: generateExportList', () => {
  it('Should convert object of folders into array of paths', () => {
    const res = generateExportList({
      folder1: [{ path: 'path1' }, { path: 'path2' }],
      folder2: [{ path: 'path12' }, { path: 'path24' }],
    });
    expect(res).toEqual(['path1', 'path2', 'path12', 'path24']);
  });
});
