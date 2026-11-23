import { describe, expect, test } from 'vitest';

import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { ResourceAccess } from '@/src/models/dial/resource-dependency';
import { DependencyFormValues } from '../../models';
import {
  hasDependencyErrors,
  isDependencyLimitReached,
  validateAccess,
  validateDependency,
  validateLinkId,
  validatePath,
} from '../validate-dependency';

const VALID_VALUES: DependencyFormValues = {
  linkId: 'docs',
  path: 'files/public/folder/',
  access: [ResourceAccess.Read],
  isRequired: false,
};

describe('validatePath', () => {
  test.each(['skills/{current-user}/', 'files/public/folder/', 'files/public/folder/file.txt', 'prompts/public/x'])(
    'accepts %s',
    (path) => {
      expect(validatePath(path)).toBeNull();
    },
  );

  test('accepts every declarable root', () => {
    ['files', 'prompts', 'conversations', 'applications', 'toolsets', 'skills', 'projects'].forEach((root) => {
      expect(validatePath(`${root}/public/x`)).toBeNull();
    });
  });

  test.each(['', '   ', '/', '//'])('requires a path for %j', (path) => {
    expect(validatePath(path)?.key).toBe(ResourceDependenciesI18nKey.PathRequired);
  });

  test('rejects an unknown root and names the allowed ones', () => {
    const issue = validatePath('models/public/x');

    expect(issue?.key).toBe(ResourceDependenciesI18nKey.PathRoot);
    expect(issue?.params?.roots).toContain('files');
  });

  test('rejects a concrete personal path', () => {
    expect(validatePath('users/abc/files/x')?.key).toBe(ResourceDependenciesI18nKey.PathUsers);
  });

  test.each([
    ['files/', 'files'],
    ['files/public', 'files'],
    ['skills/{current-user}', 'skills'],
  ])('rejects incomplete path %s with a bucket example', (path, root) => {
    expect(validatePath(path)).toEqual({
      key: ResourceDependenciesI18nKey.PathTypeRoot,
      params: { type: root, bucket: '{bucket}' },
    });
  });

  test('accepts a bucket path with a trailing slash as a folder', () => {
    expect(validatePath('files/public/')).toBeNull();
    expect(validatePath('skills/{current-user}/')).toBeNull();
  });

  test('rejects an empty segment anywhere, including a trailing one', () => {
    expect(validatePath('files/public//x')?.key).toBe(ResourceDependenciesI18nKey.PathEmptySegment);
    expect(validatePath('files/public/x//')?.key).toBe(ResourceDependenciesI18nKey.PathEmptySegment);
  });

  test('rejects the placeholder outside the second segment', () => {
    expect(validatePath('files/public/{current-user}/')?.key).toBe(ResourceDependenciesI18nKey.PathPlaceholderPosition);
  });

  test('rejects the placeholder as the root, reporting the root first', () => {
    expect(validatePath('{current-user}/x')?.key).toBe(ResourceDependenciesI18nKey.PathRoot);
  });

  test('rejects an empty middle segment', () => {
    expect(validatePath('files//x')?.key).toBe(ResourceDependenciesI18nKey.PathEmptySegment);
  });

  test('rejects wildcards', () => {
    expect(validatePath('files/public/*')?.key).toBe(ResourceDependenciesI18nKey.PathWildcard);
  });

  test.each(['files/public/../x', 'files/public/./x', 'files/public/%2e%2e/x', 'files/public/%2E/x'])(
    'rejects relative segment in %s',
    (path) => {
      expect(validatePath(path)?.key).toBe(ResourceDependenciesI18nKey.PathRelative);
    },
  );

  test('rejects an encoded wildcard', () => {
    expect(validatePath('files/public/%2a')?.key).toBe(ResourceDependenciesI18nKey.PathWildcard);
  });

  test('accepts an encoded placeholder in the second segment', () => {
    expect(validatePath('skills/%7Bcurrent-user%7D/')).toBeNull();
  });

  test('keeps an undecodable segment as is instead of throwing', () => {
    expect(validatePath('files/public/%E0%A4%A')).toBeNull();
  });

  test('ignores surrounding whitespace', () => {
    expect(validatePath('  files/public/x  ')).toBeNull();
  });
});

describe('validateLinkId', () => {
  test('requires a non-blank value', () => {
    expect(validateLinkId('  ', [])?.key).toBe(ResourceDependenciesI18nKey.LinkIdRequired);
  });

  test('rejects an id another dependency uses, after trimming', () => {
    expect(validateLinkId(' docs ', ['docs'])?.key).toBe(ResourceDependenciesI18nKey.LinkIdDuplicate);
  });

  test('is case-sensitive', () => {
    expect(validateLinkId('Docs', ['docs'])).toBeNull();
  });

  test('accepts a unique id', () => {
    expect(validateLinkId('docs', ['other'])).toBeNull();
  });
});

describe('validateAccess', () => {
  const READ_WRITE = [ResourceAccess.Read, ResourceAccess.Write];

  test('requires at least one right', () => {
    expect(validateAccess([], 'files/public/x')?.key).toBe(ResourceDependenciesI18nKey.AccessRequired);
  });

  test('reports a missing right before the write restriction', () => {
    expect(validateAccess([], 'applications/public/x')?.key).toBe(ResourceDependenciesI18nKey.AccessRequired);
  });

  test('accepts a selected right', () => {
    expect(validateAccess([ResourceAccess.Write], 'files/public/x')).toBeNull();
  });

  test.each([
    'applications/public/x/',
    'toolsets/public/x/',
    'applications/{current-user}/x',
    '%61pplications/public/x',
  ])('rejects Write on %s and names the type', (path) => {
    const issue = validateAccess(READ_WRITE, path);

    expect(issue?.key).toBe(ResourceDependenciesI18nKey.WriteNotAllowed);
    expect(issue?.params?.type).toBe(path.includes('toolsets') ? 'toolsets' : 'applications');
  });

  test.each(['applications/public/x/', 'toolsets/public/x/'])('accepts Read alone on %s', (path) => {
    expect(validateAccess([ResourceAccess.Read], path)).toBeNull();
  });

  test.each(['files', 'prompts', 'conversations', 'skills'])('accepts Write on %s', (root) => {
    expect(validateAccess(READ_WRITE, `${root}/public/x`)).toBeNull();
  });

  test('ignores surrounding whitespace in the path', () => {
    expect(validateAccess(READ_WRITE, '  applications/public/x  ')?.key).toBe(
      ResourceDependenciesI18nKey.WriteNotAllowed,
    );
  });

  test('accepts Write while the path is still empty', () => {
    expect(validateAccess(READ_WRITE, '')).toBeNull();
  });
});

describe('validateDependency', () => {
  test('returns no errors for valid values', () => {
    const errors = validateDependency(VALID_VALUES, []);

    expect(errors).toEqual({});
    expect(hasDependencyErrors(errors)).toBe(false);
  });

  test('collects an error per invalid field', () => {
    const errors = validateDependency({ ...VALID_VALUES, linkId: '', path: '', access: [] }, []);

    expect(Object.keys(errors).sort()).toEqual(['access', 'linkId', 'path']);
    expect(hasDependencyErrors(errors)).toBe(true);
  });

  test('flags Write on an applications target as an access error only', () => {
    const errors = validateDependency(
      { ...VALID_VALUES, path: 'applications/public/x/', access: [ResourceAccess.Read, ResourceAccess.Write] },
      [],
    );

    expect(Object.keys(errors)).toEqual(['access']);
    expect(errors.access?.key).toBe(ResourceDependenciesI18nKey.WriteNotAllowed);
  });

  test('clears the write error once the path moves to a writable root', () => {
    const values = { ...VALID_VALUES, access: [ResourceAccess.Read, ResourceAccess.Write] };

    expect(validateDependency({ ...values, path: 'toolsets/public/x/' }, [])).toHaveProperty('access');
    expect(validateDependency({ ...values, path: 'files/public/x/' }, [])).toEqual({});
  });
});

describe('isDependencyLimitReached', () => {
  test('is reached at 100 entries', () => {
    expect(isDependencyLimitReached(99)).toBe(false);
    expect(isDependencyLimitReached(100)).toBe(true);
  });
});
