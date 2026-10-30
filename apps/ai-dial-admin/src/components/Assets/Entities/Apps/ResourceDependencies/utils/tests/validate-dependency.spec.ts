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
    ['files', 'prompts', 'conversations', 'applications', 'toolsets', 'skills'].forEach((root) => {
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

  test('rejects the bare type root', () => {
    const issue = validatePath('files/');

    expect(issue?.key).toBe(ResourceDependenciesI18nKey.PathTypeRoot);
    expect(issue?.params?.type).toBe('files');
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
  test('requires at least one right', () => {
    expect(validateAccess([])?.key).toBe(ResourceDependenciesI18nKey.AccessRequired);
  });

  test('accepts a selected right', () => {
    expect(validateAccess([ResourceAccess.Write])).toBeNull();
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
});

describe('isDependencyLimitReached', () => {
  test('is reached at 100 entries', () => {
    expect(isDependencyLimitReached(99)).toBe(false);
    expect(isDependencyLimitReached(100)).toBe(true);
  });
});
