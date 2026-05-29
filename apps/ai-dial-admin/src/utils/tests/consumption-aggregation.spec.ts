import { describe, expect, test } from 'vitest';

import { TelemetryData } from '@/src/models/telemetry';
import { aggregateByDeployment, aggregateByProject } from '@/src/utils/consumption-aggregation';

const HEADERS = [
  'deployment',
  'parent_deployment',
  'execution_path',
  'project_id',
  'count',
  'money',
  'aggregated_money',
  'tokens_p',
  'tokens_c',
];

interface RowInput {
  deployment?: string;
  parent_deployment?: string;
  execution_path?: string;
  project_id?: string;
  count?: string;
  money?: string;
  aggregated_money?: string;
  tokens_p?: string;
  tokens_c?: string;
}

const makeRow = (overrides: RowInput): string[] => {
  const r: Required<RowInput> = {
    deployment: '',
    parent_deployment: '',
    execution_path: '',
    project_id: '',
    count: '0',
    money: '0',
    aggregated_money: '0',
    tokens_p: '0',
    tokens_c: '0',
    ...overrides,
  };
  return [
    r.deployment,
    r.parent_deployment,
    r.execution_path,
    r.project_id,
    r.count,
    r.money,
    r.aggregated_money,
    r.tokens_p,
    r.tokens_c,
  ];
};

const makeData = (rows: RowInput[]): TelemetryData => ({
  headers: HEADERS,
  data: rows.map(makeRow),
});

describe('Utils :: consumption-aggregation :: aggregateByDeployment', () => {
  test('returns [] for empty data', () => {
    expect(aggregateByDeployment({ headers: HEADERS, data: [] })).toEqual([]);
    expect(aggregateByDeployment({ headers: HEADERS })).toEqual([]);
  });

  test('passes a single row through with no math change', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_x',
        count: '5',
        money: '1.25',
        aggregated_money: '7',
        tokens_p: '50',
        tokens_c: '20',
      },
    ]);

    expect(aggregateByDeployment(data)).toEqual([
      {
        name: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        requests: '5',
        cost: '1.25',
        deployment_cost: '7',
        prompts: '50',
        completions: '20',
      },
    ]);
  });

  test('collapses three projects under one (deployment, parent, execution_path) triplet', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_1',
        count: '1',
        tokens_p: '0',
      },
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_2',
        count: '2',
        tokens_p: '100',
      },
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_3',
        count: '3',
        tokens_p: '200',
      },
    ]);

    const out = aggregateByDeployment(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      name: 'd_1',
      parent_deployment: 'p_1',
      execution_path: 'p_1/d_1',
      requests: '6',
      prompts: '300',
    });
  });

  test('keeps two distinct triplets as separate rows', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_x',
        tokens_p: '10',
      },
      {
        deployment: 'd_2',
        parent_deployment: 'p_2',
        execution_path: 'p_2/d_2',
        project_id: 'p_x',
        tokens_p: '20',
      },
    ]);

    const out = aggregateByDeployment(data);
    expect(out).toHaveLength(2);
    expect(out.find((r) => r.name === 'd_1')?.prompts).toBe('10');
    expect(out.find((r) => r.name === 'd_2')?.prompts).toBe('20');
  });

  test('merges a root that the backend emits with both "" and "undefined" parent sentinels', () => {
    const data = makeData([
      { deployment: 'app-A', parent_deployment: '', execution_path: 'app-A', project_id: 'p_x', tokens_p: '100' },
      {
        deployment: 'app-A',
        parent_deployment: 'undefined',
        execution_path: 'app-A',
        project_id: 'p_x',
        tokens_p: '27',
      },
    ]);

    const out = aggregateByDeployment(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'app-A', execution_path: 'app-A', prompts: '127' });
  });

  test('merges a child whose parent_deployment and path-derived parent resolve identically', () => {
    const data = makeData([
      { deployment: 'leaf', parent_deployment: 'X', execution_path: 'X/leaf', project_id: 'p_x', tokens_p: '40' },
      { deployment: 'leaf', parent_deployment: '', execution_path: 'X/leaf', project_id: 'p_x', tokens_p: '2' },
    ]);

    const out = aggregateByDeployment(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'leaf', execution_path: 'X/leaf', prompts: '42' });
  });

  test('emits numerics as strings (not numbers)', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_x',
        count: '3',
        tokens_p: '7',
      },
    ]);

    const out = aggregateByDeployment(data);
    expect(typeof out[0].requests).toBe('string');
    expect(typeof out[0].prompts).toBe('string');
  });

  test('preserves big-number precision across collapse', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_1',
        tokens_p: '9007199254740991',
      },
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_2',
        tokens_p: '1',
      },
    ]);

    const out = aggregateByDeployment(data);
    expect(out[0].prompts).toBe('9007199254740992');
  });

  test('treats malformed numeric cells as zero instead of throwing', () => {
    // Backend sometimes emits sentinels like 'undefined' / 'null' / 'NaN' in
    // numeric columns; Big.js throws on those. The aggregator must absorb them.
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_x',
        tokens_p: 'undefined',
        tokens_c: '100',
      },
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'p_y',
        tokens_p: 'NaN',
        tokens_c: 'null',
      },
    ]);

    const run = () => aggregateByDeployment(data);
    expect(run).not.toThrow();

    const out = run();
    expect(out).toHaveLength(1);
    expect(out[0].prompts).toBe('0'); // both rows had non-numeric tokens_p
    expect(out[0].completions).toBe('100'); // '100' counted, 'null' ignored
  });

  test('passes empty execution_path rows through (still aggregated by their triplet)', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: '',
        execution_path: '',
        project_id: 'p_1',
        count: '1',
      },
      {
        deployment: 'd_1',
        parent_deployment: '',
        execution_path: '',
        project_id: 'p_2',
        count: '2',
      },
    ]);

    const out = aggregateByDeployment(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'd_1', execution_path: '', requests: '3' });
  });
});

describe('Utils :: consumption-aggregation :: aggregateByProject', () => {
  test('returns [] for empty data', () => {
    expect(aggregateByProject({ headers: HEADERS, data: [] })).toEqual([]);
    expect(aggregateByProject({ headers: HEADERS })).toEqual([]);
  });

  test('collapses three root deployments under one project into one row', () => {
    const data = makeData([
      { deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_x', tokens_p: '10' },
      { deployment: 'd_2', parent_deployment: '', execution_path: 'd_2', project_id: 'p_x', tokens_p: '20' },
      { deployment: 'd_3', parent_deployment: '', execution_path: 'd_3', project_id: 'p_x', tokens_p: '30' },
    ]);

    const out = aggregateByProject(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'p_x', prompts: '60' });
  });

  test('three projects under one root deployment produce three project rows', () => {
    const data = makeData([
      { deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_1', tokens_p: '0' },
      { deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_2', tokens_p: '100' },
      { deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_3', tokens_p: '200' },
    ]);

    const out = aggregateByProject(data);
    expect(out).toHaveLength(3);
    expect(out.find((r) => r.name === 'p_1')?.prompts).toBe('0');
    expect(out.find((r) => r.name === 'p_2')?.prompts).toBe('100');
    expect(out.find((r) => r.name === 'p_3')?.prompts).toBe('200');
  });

  test('emits numerics as strings (not numbers)', () => {
    const data = makeData([
      { deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: 'p_x', count: '3', tokens_p: '7' },
    ]);

    const out = aggregateByProject(data);
    expect(typeof out[0].requests).toBe('string');
    expect(typeof out[0].prompts).toBe('string');
  });

  test('preserves big-number precision across collapse', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: '',
        execution_path: 'd_1',
        project_id: 'p_x',
        tokens_p: '9007199254740991',
      },
      { deployment: 'd_2', parent_deployment: '', execution_path: 'd_2', project_id: 'p_x', tokens_p: '1' },
    ]);

    const out = aggregateByProject(data);
    expect(out[0].prompts).toBe('9007199254740992');
  });

  test('root rows with missing project_id aggregate under the empty bucket', () => {
    const data = makeData([
      { deployment: 'd_1', parent_deployment: '', execution_path: 'd_1', project_id: '', tokens_p: '5' },
      { deployment: 'd_2', parent_deployment: '', execution_path: 'd_2', project_id: '', tokens_p: '7' },
    ]);

    const out = aggregateByProject(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: '', prompts: '12' });
  });

  test('excludes non-root rows (non-empty parent_deployment) to avoid orchestrator/child double-counting', () => {
    const data = makeData([
      // root
      {
        deployment: 'orchestrator',
        parent_deployment: '',
        execution_path: 'orchestrator',
        project_id: 'p_x',
        tokens_p: '333',
      },
      // child of the root — must be excluded
      {
        deployment: 'child',
        parent_deployment: 'orchestrator',
        execution_path: 'orchestrator/child',
        project_id: 'p_x',
        tokens_p: '111',
      },
    ]);

    const out = aggregateByProject(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'p_x', prompts: '333' });
  });

  test('treats parent_deployment === "undefined" sentinel as a root', () => {
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'undefined',
        execution_path: 'd_1',
        project_id: 'p_x',
        tokens_p: '42',
      },
    ]);

    const out = aggregateByProject(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'p_x', prompts: '42' });
  });

  test('counts orphan child (parent absent in same project) as a synthetic root', () => {
    // 'child' references parent 'orchestrator' but the orchestrator row is missing
    // from the response → treat the child as the project's root so its tokens are not lost.
    const data = makeData([
      {
        deployment: 'child',
        parent_deployment: 'orchestrator',
        execution_path: 'orchestrator/child',
        project_id: 'p_x',
        tokens_p: '100',
      },
    ]);

    const out = aggregateByProject(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'p_x', prompts: '100' });
  });

  test('mixed: real-root project skips its children, orphan-child project keeps the orphan', () => {
    // Exact scenario from the user's spec:
    //   d_1 | p_1 | p_1/d_1 | pr_1 | 111   ← child, parent p_1 IS present → skip
    //   p_1 |     |     p_1 | pr_1 | 333   ← real root → 333
    //   d_2 | p_2 | p_2/d_2 | pr_2 | 555   ← child, parent p_2 is absent → synthetic root → 555
    const data = makeData([
      {
        deployment: 'd_1',
        parent_deployment: 'p_1',
        execution_path: 'p_1/d_1',
        project_id: 'pr_1',
        tokens_p: '111',
      },
      { deployment: 'p_1', parent_deployment: '', execution_path: 'p_1', project_id: 'pr_1', tokens_p: '333' },
      {
        deployment: 'd_2',
        parent_deployment: 'p_2',
        execution_path: 'p_2/d_2',
        project_id: 'pr_2',
        tokens_p: '555',
      },
    ]);

    const out = aggregateByProject(data);
    expect(out).toHaveLength(2);
    expect(out.find((r) => r.name === 'pr_1')?.prompts).toBe('333');
    expect(out.find((r) => r.name === 'pr_2')?.prompts).toBe('555');
  });

  test('orphan-parent scoping is per-project (same deployment name in another project does not count)', () => {
    // 'orchestrator' exists in pr_other but NOT in pr_x. The child in pr_x must still
    // be treated as an orphan-root — parent presence is scoped per project_id.
    const data = makeData([
      {
        deployment: 'orchestrator',
        parent_deployment: '',
        execution_path: 'orchestrator',
        project_id: 'pr_other',
        tokens_p: '999',
      },
      {
        deployment: 'child',
        parent_deployment: 'orchestrator',
        execution_path: 'orchestrator/child',
        project_id: 'pr_x',
        tokens_p: '50',
      },
    ]);

    const out = aggregateByProject(data);
    expect(out.find((r) => r.name === 'pr_other')?.prompts).toBe('999');
    expect(out.find((r) => r.name === 'pr_x')?.prompts).toBe('50');
  });

  test('deep chain with present parents counts only the real root', () => {
    // app-A → mid → leaf, all rows present. Only app-A contributes.
    const data = makeData([
      {
        deployment: 'app-A',
        parent_deployment: '',
        execution_path: 'app-A',
        project_id: 'p_x',
        tokens_p: '10',
      },
      {
        deployment: 'mid',
        parent_deployment: 'app-A',
        execution_path: 'app-A/mid',
        project_id: 'p_x',
        tokens_p: '20',
      },
      {
        deployment: 'leaf',
        parent_deployment: 'mid',
        execution_path: 'app-A/mid/leaf',
        project_id: 'p_x',
        tokens_p: '40',
      },
    ]);

    const out = aggregateByProject(data);
    expect(out[0].prompts).toBe('10');
  });
});
