/** Mirrors Core's `Router.Mode`. Absent on a stored router means `Proxy`. */
export enum RouterMode {
  Proxy = 'proxy',
  Decision = 'decision',
}

/** Mirrors Core's `Router.Decision`: the decide request's settings, valid only in `RouterMode.Decision`. */
export interface RouterDecision {
  body?: boolean;
  timeoutMs?: number;
  maxDecisions?: number;
}
