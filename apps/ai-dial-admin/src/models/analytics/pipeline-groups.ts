/**
 * One group of a group pipeline, as the runner tracks it.
 *
 * Facts only — identifiers, versions, timestamps and counts. There is no readiness verdict: the console
 * derives one against the pipeline's own `ready_when`, and no member rows or label either, which are source
 * content.
 */
export interface PipelineGroup {
  group_key: string;
  /** The newest member's version, as epoch milliseconds. */
  group_version: number;
  last_activity_at: string;
  /** Whether any member matched the pipeline's `ready_when.signal`; never cleared by a later member. */
  signalled: boolean;
  /** The version the last written evaluation saw; absent until the group is first evaluated. */
  computed_version?: number | null;
  computed_at?: string | null;
  computed_truncated: boolean;
  /** The UTC day `evaluations` was counted against. A count from an earlier day is zero today. */
  evaluations_day?: string | null;
  evaluations: number;
  /** Whether the group holds members its last evaluation did not see. */
  dirty: boolean;
}

export interface PipelineGroupsResponse {
  groups: PipelineGroup[];
}
