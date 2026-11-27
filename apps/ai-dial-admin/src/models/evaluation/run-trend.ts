/** Kind of target a test suite evaluates; also the value the run-trends endpoint reports as `suiteType`. */
export enum SuiteType {
  Deployment = 'DEPLOYMENT',
  McpTool = 'MCP_TOOL',
  Route = 'ROUTE',
}

/**
 * The suite's target as it is now. The backend leaves out every field the reference does not carry
 * (`id` and `type` for a route, `toolName` unless the suite targets an MCP tool), so all are optional.
 */
export interface RunTrendEvaluatee {
  id?: string;
  name?: string;
  /** The reference's own deployment type value, e.g. `dial-model`; not mapped by the backend. */
  type?: string;
  toolName?: string;
}

export interface RunTrendPoint {
  runId: string;
  createdAt: number;
  /** 0–1; absent when the run had no test cases. */
  passRate?: number;
  passedCount: number;
  totalCount: number;
}

/** One suite of `GET /analytics/test-suites/run-trends`; `runs` is oldest first, at most 10. */
export interface SuiteRunTrend {
  suiteId: string;
  suiteName: string;
  suiteType: SuiteType;
  evaluatee: RunTrendEvaluatee;
  runs: RunTrendPoint[];
  latestPassRate?: number;
  previousPassRate?: number;
  delta?: number;
}
