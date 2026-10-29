import { describe, expect, test } from 'vitest';

import { OrgUnitSubject, OrgUnitSubjectFunction, SubjectKind } from '@/src/models/dial/org-unit';
import {
  MAX_HOLDER_LENGTH,
  buildSubject,
  classifySubject,
  isValidDisplayName,
  isValidHolderValue,
  subjectKey,
} from '../subjects';

const subject = (source: string, fn: OrgUnitSubjectFunction, targets?: string[]): OrgUnitSubject => ({
  type: 'claimsPredicate',
  source,
  function: fn,
  targets,
});

describe('classifySubject', () => {
  test('recognises a person by the email claim', () => {
    expect(classifySubject(subject('email', OrgUnitSubjectFunction.EQUAL, ['carol@acme.com']), 'groups')).toEqual({
      kind: SubjectKind.PERSON,
      label: 'carol@acme.com',
    });
  });

  test('recognises a person by an at sign in the target', () => {
    expect(classifySubject(subject('upn', OrgUnitSubjectFunction.EQUAL, ['a@b.c']), 'groups').kind).toBe(
      SubjectKind.PERSON,
    );
  });

  test('recognises a group only on the configured claim', () => {
    const eq = subject('realm_access.roles', OrgUnitSubjectFunction.EQUAL, ['us-risk']);
    expect(classifySubject(eq, 'realm_access.roles').kind).toBe(SubjectKind.GROUP);
    expect(classifySubject(eq, 'groups')).toEqual({ kind: SubjectKind.RAW, label: 'realm_access.roles = us-risk' });
  });

  test('recognises everyone signed in and DIAL roles', () => {
    expect(classifySubject(subject('sub', OrgUnitSubjectFunction.TRUE), 'groups').kind).toBe(SubjectKind.EVERYONE);
    expect(classifySubject(subject('roles', OrgUnitSubjectFunction.EQUAL, ['admin']), 'groups').kind).toBe(
      SubjectKind.DIAL_ROLE,
    );
  });

  test('treats the roles claim as a DIAL role even when it is also the configured group claim', () => {
    const roles = subject('roles', OrgUnitSubjectFunction.EQUAL, ['admin']);

    expect(classifySubject(roles, 'roles').kind).toBe(SubjectKind.DIAL_ROLE);
  });

  test('keeps any other subject raw with all targets', () => {
    expect(classifySubject(subject('tenant', OrgUnitSubjectFunction.EQUAL, ['a', 'b']), 'groups')).toEqual({
      kind: SubjectKind.RAW,
      label: 'tenant = a, b',
    });
    expect(classifySubject(subject('roles', OrgUnitSubjectFunction.TRUE), 'groups').kind).toBe(SubjectKind.RAW);
  });
});

describe('buildSubject', () => {
  test('builds each kind', () => {
    expect(buildSubject(SubjectKind.PERSON, ' a@b.c ', 'groups')).toEqual(
      subject('email', OrgUnitSubjectFunction.EQUAL, ['a@b.c']),
    );
    expect(buildSubject(SubjectKind.GROUP, 'g', 'realm_access.roles')).toEqual(
      subject('realm_access.roles', OrgUnitSubjectFunction.EQUAL, ['g']),
    );
    expect(buildSubject(SubjectKind.DIAL_ROLE, 'r', 'groups').source).toBe('roles');
  });

  test('everyone carries no targets', () => {
    expect(buildSubject(SubjectKind.EVERYONE, '', 'groups')).toEqual({
      type: 'claimsPredicate',
      source: 'sub',
      function: OrgUnitSubjectFunction.TRUE,
    });
  });

  test('refuses a raw kind', () => {
    expect(() => buildSubject(SubjectKind.RAW, 'x', 'groups')).toThrow();
  });
});

describe('validation', () => {
  test('holder value must be non-blank, short and free of control characters', () => {
    expect(isValidHolderValue('ok')).toBe(true);
    expect(isValidHolderValue('   ')).toBe(false);
    expect(isValidHolderValue('a'.repeat(MAX_HOLDER_LENGTH + 1))).toBe(false);
    expect(isValidHolderValue('a\u0007b')).toBe(false);
  });

  test('display name allows blank but not long or control characters', () => {
    expect(isValidDisplayName('')).toBe(true);
    expect(isValidDisplayName('a'.repeat(129))).toBe(false);
    expect(isValidDisplayName('a\nb')).toBe(false);
  });
});

describe('subjectKey', () => {
  test('ignores target order and case', () => {
    expect(subjectKey(subject('groups', OrgUnitSubjectFunction.EQUAL, ['B', 'a']))).toBe(
      subjectKey(subject('groups', OrgUnitSubjectFunction.EQUAL, ['A', 'b'])),
    );
  });
});
