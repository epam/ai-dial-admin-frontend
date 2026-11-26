import { DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { PipelinePreview } from '@/src/models/analytics/pipeline-preview';

export enum ModelRunStatus {
  Ok = 'ok',
  Failed = 'failed',
}

export enum ModelRunUsageUnit {
  Tokens = 'tokens',
  Calls = 'calls',
}

export interface ModelRunUsage {
  amount: number;
  unit: ModelRunUsageUnit | string;
}

export interface ModelRunEvaluation {
  grain_key?: unknown;
  group_key?: string;
  status: ModelRunStatus;
  stage?: DlqStage | string;
  outputs?: Record<string, unknown>;
  request?: string;
  request_truncated?: boolean;
  response?: string;
  response_truncated?: boolean;
  dial_status?: number;
  message?: string;
  errors?: string[];
  attempts: number;
  usage?: ModelRunUsage;
  latency_ms: number;
  members_included?: number;
  members_omitted?: number;
  members_truncated?: boolean;
}

export interface PipelineModelRun {
  preview: PipelinePreview;
  evaluations: ModelRunEvaluation[];
}
