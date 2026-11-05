import { PolicySubjectFunction } from '@/src/models/dial/policy';

export const SUBJECT_FUNCTION_OPTIONS: PolicySubjectFunction[] = [
  PolicySubjectFunction.TRUE,
  PolicySubjectFunction.FALSE,
  PolicySubjectFunction.EQUAL,
  PolicySubjectFunction.CONTAIN,
  PolicySubjectFunction.REGEX,
];
