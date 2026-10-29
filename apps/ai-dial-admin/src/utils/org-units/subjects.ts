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

export const classifySubject = (subject: OrgUnitSubject, groupClaim: string): ClassifiedSubject => {
  const targets = subject.targets ?? [];
  const joined = targets.join(', ');
  if (subject.function === OrgUnitSubjectFunction.TRUE && subject.source === EVERYONE_SOURCE && targets.length === 0) {
    return { kind: SubjectKind.EVERYONE, label: '' };
  }
  if (subject.function === OrgUnitSubjectFunction.EQUAL) {
    if (subject.source === EMAIL_SOURCE || (subject.source !== groupClaim && targets.some((t) => t.includes('@')))) {
      return { kind: SubjectKind.PERSON, label: joined };
    }
    if (subject.source === groupClaim) {
      return { kind: SubjectKind.GROUP, label: joined };
    }
    if (subject.source === ROLES_SOURCE) {
      return { kind: SubjectKind.DIAL_ROLE, label: joined };
    }
  }
  return { kind: SubjectKind.RAW, label: `${subject.source} = ${joined}` };
};

export const buildSubject = (kind: SubjectKind, value: string, groupClaim: string): OrgUnitSubject => {
  const trimmed = value.trim();
  switch (kind) {
    case SubjectKind.PERSON:
      return subjectOf(EMAIL_SOURCE, OrgUnitSubjectFunction.EQUAL, [trimmed]);
    case SubjectKind.GROUP:
      return subjectOf(groupClaim, OrgUnitSubjectFunction.EQUAL, [trimmed]);
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

export const isValidDisplayName = (value: string): boolean =>
  value.length <= MAX_DISPLAY_NAME_LENGTH && !CONTROL_CHARS.test(value);

/** Identity of a subject for diffing and de-duplication: claim, function and sorted lower-cased targets. */
export const subjectKey = (subject: OrgUnitSubject): string =>
  [subject.source, subject.function, ...[...(subject.targets ?? [])].map((t) => t.toLowerCase()).sort()].join('|');
