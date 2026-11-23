import { PolicySubjectFunction } from '@/src/models/dial/policy';

export enum PolicyCreateStep {
  Details = 'details',
  Subjects = 'subjects',
}

export const SUBJECT_FUNCTION_OPTIONS: PolicySubjectFunction[] = [
  PolicySubjectFunction.TRUE,
  PolicySubjectFunction.FALSE,
  PolicySubjectFunction.EQUAL,
  PolicySubjectFunction.CONTAIN,
  PolicySubjectFunction.REGEX,
];
