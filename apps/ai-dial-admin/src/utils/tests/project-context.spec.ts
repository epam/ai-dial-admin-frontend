import { describe, expect, test } from 'vitest';

import { ContextFileRejectionReason, ProjectContextLimits } from '@/src/models/project-context';
import { checkContextFiles, formatContextSize, getContextFilesSize, getFileExtension } from '../project-context';

const LIMITS: ProjectContextLimits = {
  allowedExtensions: ['csv', 'pdf'],
  maxFileBytes: 100,
  maxTotalBytes: 250,
  maxFiles: 3,
};

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe('getFileExtension', () => {
  test.each([
    ['a.csv', 'csv'],
    ['A.CSV', 'csv'],
    ['archive.tar.pdf', 'pdf'],
    ['noextension', ''],
    ['.hidden', ''],
  ])('reads the extension of %s as %j', (name, expected) => {
    expect(getFileExtension(name)).toBe(expected);
  });
});

describe('getContextFilesSize', () => {
  test('sums sizes and counts a file with no reported size as 0', () => {
    expect(getContextFilesSize([{ size: 5 }, {}, { size: 7 }])).toBe(12);
  });

  test('is 0 for no files', () => {
    expect(getContextFilesSize([])).toBe(0);
  });
});

describe('formatContextSize', () => {
  test.each([
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1_048_576, '1 MB'],
    [10_485_760, '10 MB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(formatContextSize(bytes)).toBe(expected);
  });
});

describe('checkContextFiles', () => {
  test('accepts files within every limit', () => {
    const { accepted, rejected } = checkContextFiles([file('a.csv'), file('b.pdf')], [], LIMITS);

    expect(accepted.map((f) => f.name)).toEqual(['a.csv', 'b.pdf']);
    expect(rejected).toEqual([]);
  });

  test('rejects a disallowed extension, case-insensitively', () => {
    const { accepted, rejected } = checkContextFiles([file('a.txt'), file('b.CSV')], [], LIMITS);

    expect(accepted.map((f) => f.name)).toEqual(['b.CSV']);
    expect(rejected).toEqual([{ name: 'a.txt', reason: ContextFileRejectionReason.Extension }]);
  });

  test('rejects a file over the per-file size', () => {
    const { rejected } = checkContextFiles([file('a.csv', 101)], [], LIMITS);

    expect(rejected).toEqual([{ name: 'a.csv', reason: ContextFileRejectionReason.FileSize }]);
  });

  test('accepts a file exactly at the per-file size', () => {
    expect(checkContextFiles([file('a.csv', 100)], [], LIMITS).accepted).toHaveLength(1);
  });

  test('rejects a name that already exists among the remaining files', () => {
    const { rejected } = checkContextFiles([file('a.csv')], [{ name: 'a.csv', size: 1 }], LIMITS);

    expect(rejected).toEqual([{ name: 'a.csv', reason: ContextFileRejectionReason.Duplicate }]);
  });

  test('rejects a duplicate within the same batch', () => {
    const { accepted, rejected } = checkContextFiles([file('a.csv'), file('a.csv')], [], LIMITS);

    expect(accepted).toHaveLength(1);
    expect(rejected).toEqual([{ name: 'a.csv', reason: ContextFileRejectionReason.Duplicate }]);
  });

  test('rejects a file that would push the total over capacity, counting earlier accepted files', () => {
    const { accepted, rejected } = checkContextFiles(
      [file('a.csv', 100), file('b.csv', 100), file('c.csv', 60)],
      [],
      LIMITS,
    );

    expect(accepted.map((f) => f.name)).toEqual(['a.csv', 'b.csv']);
    expect(rejected).toEqual([{ name: 'c.csv', reason: ContextFileRejectionReason.TotalSize }]);
  });

  test('counts stored file sizes toward the total', () => {
    const { rejected } = checkContextFiles([file('b.csv', 60)], [{ name: 'a.csv', size: 200 }], LIMITS);

    expect(rejected).toEqual([{ name: 'b.csv', reason: ContextFileRejectionReason.TotalSize }]);
  });

  test('rejects files beyond the maximum count', () => {
    const existing = [{ name: 'x.csv' }, { name: 'y.csv' }];

    const { accepted, rejected } = checkContextFiles([file('a.csv'), file('b.csv')], existing, LIMITS);

    expect(accepted.map((f) => f.name)).toEqual(['a.csv']);
    expect(rejected).toEqual([{ name: 'b.csv', reason: ContextFileRejectionReason.FileCount }]);
  });

  test('returns nothing for no incoming files', () => {
    expect(checkContextFiles([], [], LIMITS)).toEqual({ accepted: [], rejected: [] });
  });
});
