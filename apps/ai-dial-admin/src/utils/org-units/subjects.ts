import { OrgUnitSubject, OrgUnitSubjectFunction, SubjectKind } from '@/src/models/dial/org-unit';

export const MAX_HOLDER_LENGTH = 256;
export const MAX_DISPLAY_NAME_LENGTH = 128;

const EMAIL_SOURCE = 'email';
const ROLES_SOURCE = 'roles';
const EVERYONE_SOURCE = 'sub';

export interface ClassifiedSubject {
  kind: SubjectKind;
  /** Text for the chip: the target(s) for known kinds, `source = targets` for raw ones. */
  label: string;
}

/** Claim names that have a holder type of their own, so a custom claim cannot reuse them. */
export const RESERVED_CLAIM_KEYS: readonly string[] = [EMAIL_SOURCE, ROLES_SOURCE, EVERYONE_SOURCE];

export const classifySubject = (subject: OrgUnitSubject): ClassifiedSubject => {
  const targets = subject.targets ?? [];
  const joined = targets.join(', ');
  if (subject.function === OrgUnitSubjectFunction.TRUE && subject.source === EVERYONE_SOURCE && targets.length === 0) {
    return { kind: SubjectKind.EVERYONE, label: '' };
  }
  if (subject.function === OrgUnitSubjectFunction.EQUAL && targets.length > 0) {
    if (subject.source === EMAIL_SOURCE) {
      return { kind: SubjectKind.PERSON, label: joined };
    }
    if (subject.source === ROLES_SOURCE) {
      return { kind: SubjectKind.DIAL_ROLE, label: joined };
    }
    return { kind: SubjectKind.CLAIM, label: `${subject.source}=${joined}` };
  }
  return { kind: SubjectKind.RAW, label: `${subject.source} = ${joined}` };
};

export const buildSubject = (kind: SubjectKind, value: string, claimKey?: string): OrgUnitSubject => {
  const trimmed = value.trim();
  switch (kind) {
    case SubjectKind.PERSON:
      return subjectOf(EMAIL_SOURCE, OrgUnitSubjectFunction.EQUAL, [trimmed]);
    case SubjectKind.CLAIM: {
      const key = claimKey?.trim();
      if (!key) {
        throw new Error('Cannot build a claim subject without a claim name');
      }
      return subjectOf(key, OrgUnitSubjectFunction.EQUAL, [trimmed]);
    }
    case SubjectKind.DIAL_ROLE:
      return subjectOf(ROLES_SOURCE, OrgUnitSubjectFunction.EQUAL, [trimmed]);
    case SubjectKind.EVERYONE:
      return subjectOf(EVERYONE_SOURCE, OrgUnitSubjectFunction.TRUE);
    default:
      throw new Error(`Cannot build a subject for kind "${kind}"`);
  }
};

const subjectOf = (source: string, fn: OrgUnitSubjectFunction, targets?: string[]): OrgUnitSubject => ({
  type: 'claimsPredicate',
  source,
  function: fn,
  ...(targets ? { targets } : {}),
});

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export const isValidHolderValue = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_HOLDER_LENGTH && !CONTROL_CHARS.test(trimmed);
};

export const isValidClaimKey = (value: string): boolean =>
  isValidHolderValue(value) && !RESERVED_CLAIM_KEYS.includes(value.trim());

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length <= MAX_HOLDER_LENGTH && EMAIL_PATTERN.test(trimmed) && !CONTROL_CHARS.test(trimmed);
};

export const isValidDisplayName = (value: string): boolean =>
  value.length <= MAX_DISPLAY_NAME_LENGTH && !CONTROL_CHARS.test(value);

/** Identity of a subject for diffing and de-duplication: claim, function and sorted lower-cased targets. */
export const subjectKey = (subject: OrgUnitSubject): string =>
  [subject.source, subject.function, ...[...(subject.targets ?? [])].map((t) => t.toLowerCase()).sort()].join('|');
