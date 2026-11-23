import { describe, expect, test } from 'vitest';

import { OrgUnitSubject, OrgUnitSubjectFunction, SubjectKind } from '@/src/models/dial/org-unit';
import {
  MAX_HOLDER_LENGTH,
  buildSubject,
  classifySubject,
  isValidClaimKey,
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
    expect(classifySubject(subject('email', OrgUnitSubjectFunction.EQUAL, ['carol@acme.com']))).toEqual({
      kind: SubjectKind.PERSON,
      label: 'carol@acme.com',
    });
  });

  test('does not take an at sign on another claim for a person', () => {
    expect(classifySubject(subject('upn', OrgUnitSubjectFunction.EQUAL, ['a@b.c']))).toEqual({
      kind: SubjectKind.CLAIM,
      label: 'upn=a@b.c',
    });
  });

  test('recognises any other claim as a custom claim, including a former group claim', () => {
    expect(classifySubject(subject('groups', OrgUnitSubjectFunction.EQUAL, ['us-risk']))).toEqual({
      kind: SubjectKind.CLAIM,
      label: 'groups=us-risk',
    });
    expect(classifySubject(subject('realm_access.roles', OrgUnitSubjectFunction.EQUAL, ['analysts']))).toEqual({
      kind: SubjectKind.CLAIM,
      label: 'realm_access.roles=analysts',
    });
  });

  test('joins several targets of a custom claim', () => {
    expect(classifySubject(subject('department', OrgUnitSubjectFunction.EQUAL, ['risk', 'legal'])).label).toBe(
      'department=risk, legal',
    );
  });

  test('recognises everyone signed in and DIAL roles', () => {
    expect(classifySubject(subject('sub', OrgUnitSubjectFunction.TRUE)).kind).toBe(SubjectKind.EVERYONE);
    expect(classifySubject(subject('roles', OrgUnitSubjectFunction.EQUAL, ['admin'])).kind).toBe(SubjectKind.DIAL_ROLE);
  });

  test('keeps shapes the form cannot create raw', () => {
    expect(classifySubject(subject('roles', OrgUnitSubjectFunction.TRUE))).toEqual({
      kind: SubjectKind.RAW,
      label: 'roles = ',
    });
    expect(classifySubject(subject('sub', OrgUnitSubjectFunction.TRUE, ['x'])).kind).toBe(SubjectKind.RAW);
    expect(classifySubject(subject('tenant', OrgUnitSubjectFunction.EQUAL)).kind).toBe(SubjectKind.RAW);
    expect(classifySubject(subject('email', OrgUnitSubjectFunction.EQUAL, [])).kind).toBe(SubjectKind.RAW);
  });
});

describe('buildSubject', () => {
  test('builds each kind', () => {
    expect(buildSubject(SubjectKind.PERSON, ' a@b.c ')).toEqual(
      subject('email', OrgUnitSubjectFunction.EQUAL, ['a@b.c']),
    );
    expect(buildSubject(SubjectKind.DIAL_ROLE, 'r').source).toBe('roles');
  });

  test('builds a custom claim from the trimmed key and value', () => {
    expect(buildSubject(SubjectKind.CLAIM, ' analysts ', ' realm_access.roles ')).toEqual(
      subject('realm_access.roles', OrgUnitSubjectFunction.EQUAL, ['analysts']),
    );
  });

  test('refuses a custom claim without a key', () => {
    expect(() => buildSubject(SubjectKind.CLAIM, 'x')).toThrow();
    expect(() => buildSubject(SubjectKind.CLAIM, 'x', '   ')).toThrow();
  });

  test('everyone carries no targets', () => {
    expect(buildSubject(SubjectKind.EVERYONE, '')).toEqual({
      type: 'claimsPredicate',
      source: 'sub',
      function: OrgUnitSubjectFunction.TRUE,
    });
  });

  test('refuses a raw kind', () => {
    expect(() => buildSubject(SubjectKind.RAW, 'x')).toThrow();
  });

  test('a built subject classifies back to its own kind', () => {
    expect(classifySubject(buildSubject(SubjectKind.CLAIM, 'v', 'department')).kind).toBe(SubjectKind.CLAIM);
    expect(classifySubject(buildSubject(SubjectKind.PERSON, 'a@b.c')).kind).toBe(SubjectKind.PERSON);
    expect(classifySubject(buildSubject(SubjectKind.DIAL_ROLE, 'r')).kind).toBe(SubjectKind.DIAL_ROLE);
    expect(classifySubject(buildSubject(SubjectKind.EVERYONE, '')).kind).toBe(SubjectKind.EVERYONE);
  });
});

describe('validation', () => {
  test('holder value must be non-blank, short and free of control characters', () => {
    expect(isValidHolderValue('ok')).toBe(true);
    expect(isValidHolderValue('   ')).toBe(false);
    expect(isValidHolderValue('a'.repeat(MAX_HOLDER_LENGTH + 1))).toBe(false);
    expect(isValidHolderValue('a\u0007b')).toBe(false);
  });

  test('claim key follows the holder rules and refuses the reserved claims', () => {
    expect(isValidClaimKey(' realm_access.roles ')).toBe(true);
    expect(isValidClaimKey('Email')).toBe(true);
    expect(isValidClaimKey('   ')).toBe(false);
    expect(isValidClaimKey('a'.repeat(MAX_HOLDER_LENGTH + 1))).toBe(false);
    expect(isValidClaimKey('ab')).toBe(false);
    ['email', 'roles', 'sub', ' email '].forEach((key) => expect(isValidClaimKey(key)).toBe(false));
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
