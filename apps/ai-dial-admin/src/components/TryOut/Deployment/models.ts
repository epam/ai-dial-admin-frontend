import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

export interface DeploymentTryOutRequest {
  interface: DeploymentInterfaceType;
  deployment: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
}

export enum TryOutMode {
  Simple = 'simple',
  Advanced = 'advanced',
}

export enum TryOutStatus {
  Idle = 'idle',
  Sending = 'sending',
  Done = 'done',
  Failed = 'failed',
}

export enum TryOutFailureKind {
  NoAccess = 'noAccess',
  NotFound = 'notFound',
  Rejected = 'rejected',
  Server = 'server',
  Network = 'network',
}

export interface TryOutFailure {
  kind: TryOutFailureKind;
  /** Core's status, absent for a failure that never reached a response. */
  status?: number;
}
