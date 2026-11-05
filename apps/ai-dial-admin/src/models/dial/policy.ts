export enum PolicyKind {
  BUDGET = 'budget',
}

export enum PolicyQuantity {
  COST = 'cost',
  TOKENS = 'tokens',
  REQUESTS = 'requests',
}

export enum PolicySubjectFunction {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  EQUAL = 'EQUAL',
  CONTAIN = 'CONTAIN',
  REGEX = 'REGEX',
}

/** One rule of a subject; the rules of a subject are OR-composed and matched against the caller's claims. */
export interface PolicySubjectRule {
  /** `roles` or a dotted claim path. */
  source: string;
  function: PolicySubjectFunction;
  targets?: string[];
}

/** Amount per calendar window; a window left unset is not limited. */
export interface PolicyAmounts {
  day?: number;
  month?: number;
}

/**
 * What Core reads and writes for a policy. `object` is `"*"` or a list of deployment names.
 * Core rejects `attachedTo`, `harness`, `broker` and `packages` as not supported yet, so they are
 * not modeled here, and `per` is only ever `['subject']`.
 */
export interface DialPolicy {
  priority?: number;
  kind?: PolicyKind;
  quantity?: PolicyQuantity;
  object?: string | string[];
  per?: string[];
  cost?: PolicyAmounts;
  subject?: PolicySubjectRule[];
  costObject?: string;
}

/** One grant of a policy: who it reaches and in which cost object. */
export interface DialPolicyAssignment {
  /** Path of the policy under `policies`. */
  policy?: string;
  subject?: PolicySubjectRule[];
  costObject?: string;
  source?: string;
  ticket?: string;
  /** ISO-8601 date-time with an offset. */
  expiresAt?: string;
  description?: string;
}
