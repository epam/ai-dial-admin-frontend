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
  /** Top-level conversation grouping key (sibling of `data`, never inside it). Both-or-neither with `turnIndex`. */
  conversationId?: string | null;
  /** Top-level 0-based turn position within the conversation. Both-or-neither with `conversationId`. */
  turnIndex?: number | null;
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
