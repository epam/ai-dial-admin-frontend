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

export enum TryOutLookupStatus {
  Loading = 'loading',
  Ready = 'ready',
  Unavailable = 'unavailable',
  Failed = 'failed',
}

/** Why Core reports interfaces yet none of them is one Try out can call. */
export enum TryOutUnavailableReason {
  McpOnly = 'mcpOnly',
  CustomUiOnly = 'customUiOnly',
  NoInterface = 'noInterface',
}

/** Where reading a deployment's interfaces stands, and what the panel can offer from it. */
export interface TryOutLookup {
  status: TryOutLookupStatus;
  /** The interfaces to offer; non-empty only when `status` is `Ready`. */
  supportedTypes: DeploymentInterfaceType[];
  reason?: TryOutUnavailableReason;
  failure?: TryOutFailure;
}

/** What reading a deployment's interfaces came to: the interfaces Core reports, or why they could not be read. */
export interface TryOutInterfacesResult {
  interfaces?: string[];
  failure?: TryOutFailure;
}

export interface TryOutFailure {
  kind: TryOutFailureKind;
  /** Core's status, absent for a failure that never reached a response. */
  status?: number;
}
