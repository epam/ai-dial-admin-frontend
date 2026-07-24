import { TestCaseSchema, ValidationWarning } from '@/src/models/evaluation/test-suite';

export enum DatasetVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface Dataset {
  id?: string;
  name?: string;
  description?: string;
  testCaseSchema?: TestCaseSchema[];
  valid?: boolean;
  validationWarnings?: ValidationWarning[];
  visibility?: DatasetVisibility;
  bindToSuiteId?: string;
  version?: number;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface DatasetTestCase {
  id?: string;
  testCaseName?: string;
  data?: Record<string, unknown>;
  /**
   * Present only for multi-turn cases — an ordered array of per-turn data maps. Coexists with `data`
   * (shared fields live in `data`, per-turn fields in each turn map); the two are NOT mutually exclusive.
   */
  multiTurnData?: Record<string, unknown>[];
  valid?: boolean;
  validationWarnings?: ValidationWarning[];
  createdAt?: number;
  updatedAt?: number;
}

export interface DatasetVisibilityTransition {
  visibility: DatasetVisibility;
}

export interface DatasetPublishBody {
  name: string;
  description?: string;
}
