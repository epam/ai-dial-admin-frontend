import { ExtractionResultStatus } from '@/src/models/evaluation/run';

const EXECUTION_STATUS_VALUES = Object.values(ExtractionResultStatus);

export const parseExecutionStatus = (raw: string | null): ExtractionResultStatus | null => {
  if (raw === null) {
    return null;
  }
  return EXECUTION_STATUS_VALUES.includes(raw as ExtractionResultStatus) ? (raw as ExtractionResultStatus) : null;
};
