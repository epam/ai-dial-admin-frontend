export interface Step {
  id: string;
  name: string;
  status: StepStatus;
}

export enum StepStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  ERROR = 'error',
}
