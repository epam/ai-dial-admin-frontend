import { DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { describe, expect, test } from 'vitest';
import { generateFolderListFromBulkPaths, generatePromptRowDataForDelete } from '../utils';

describe('Utils :: generatePromptRowDataForDelete', () => {
  test('should group prompts by name and collect versions', () => {
    const input: DialPrompt[] = [
      { id: '1', name: 'PromptA', version: 'v1' },
      { id: '2', name: 'PromptA', version: 'v2' },
      { id: '3', name: 'PromptB', version: 'v1' },
    ];

    const result = generatePromptRowDataForDelete(input);

    expect(result.length).toBe(2);

    const promptA = result.find((p) => p.name === 'PromptA');
    expect(promptA?.versions).toEqual(['v1', 'v2']);

    const promptB = result.find((p) => p.name === 'PromptB');
    expect(promptB?.versions).toEqual(['v1']);
  });

  test('should handle empty input array', () => {
    const result = generatePromptRowDataForDelete([]);
    expect(result).toEqual([]);
  });

  test('should handle single prompt', () => {
    const input: DialPrompt[] = [{ id: '1', name: 'PromptX', version: 'v1' }];
    const result = generatePromptRowDataForDelete(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('PromptX');
    expect(result[0].versions).toEqual(['v1']);
  });

  test('should retain original prompt fields and add versions array', () => {
    const input: DialPrompt[] = [
      { id: '1', name: 'TestPrompt', version: 'v1', content: 'test content' },
      { id: '2', name: 'TestPrompt', version: 'v2', content: 'should be ignored' },
    ];

    const result = generatePromptRowDataForDelete(input);
    expect(result.length).toBe(1);

    const prompt = result[0];
    expect(prompt.name).toBe('TestPrompt');
    expect(prompt.content).toBe('test content');
    expect(prompt.versions).toEqual(['v1', 'v2']);
  });

  test('should ignore undefined or null versions', () => {
    const input: any[] = [
      { id: '1', name: 'PromptA', version: 'v1' },
      { id: '2', name: 'PromptA', version: null },
      { id: '3', name: 'PromptA' },
    ];

    const result = generatePromptRowDataForDelete(input as DialPrompt[]);
    expect(result.length).toBe(1);
    expect(result[0].versions).toEqual(['v1', null, undefined]);
  });
});

describe('generateFolderListFromBulkPaths', () => {
  test('should return an empty array when given no paths', () => {
    const result = generateFolderListFromBulkPaths([]);
    expect(result).toEqual([]);
  });

  test('should generate a single-level folder structure', () => {
    const paths = ['public/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ]);
  });

  test('should generate a nested folder structure for deep paths', () => {
    const paths = ['public/child/grand/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        children: [
          {
            name: 'child',
            path: 'public/child/',
            nodeType: DialFileNodeType.FOLDER,
            children: [
              {
                name: 'grand',
                path: 'public/child/grand/',
                nodeType: DialFileNodeType.FOLDER,
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  test('should merge overlapping paths into shared folders', () => {
    const paths = ['public/child/grand/', 'public/child/other/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        children: [
          {
            name: 'child',
            path: 'public/child/',
            nodeType: DialFileNodeType.FOLDER,
            children: [
              {
                name: 'grand',
                path: 'public/child/grand/',
                nodeType: DialFileNodeType.FOLDER,
                children: [],
              },
              {
                name: 'other',
                path: 'public/child/other/',
                nodeType: DialFileNodeType.FOLDER,
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  test('should handle sibling root folders correctly', () => {
    const paths = ['public/', 'assets/', 'content/posts/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
      {
        name: 'assets',
        path: 'assets/',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
      {
        name: 'content',
        path: 'content/',
        nodeType: DialFileNodeType.FOLDER,
        children: [
          {
            name: 'posts',
            path: 'content/posts/',
            nodeType: DialFileNodeType.FOLDER,
            children: [],
          },
        ],
      },
    ]);
  });
});
