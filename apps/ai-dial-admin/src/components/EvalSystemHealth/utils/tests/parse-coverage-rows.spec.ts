import { describe, expect, test } from 'vitest';

import { parseCoverageRows } from '@/src/components/EvalSystemHealth/utils/parse-coverage-rows';

describe('parseCoverageRows', () => {
  test('collects the ids of both refs into one set', () => {
    const covered = parseCoverageRows({
      rows: [
        { 'deployment_ref::id': 'gpt-4o', 'mcp_deployment_ref::id': null },
        { 'deployment_ref::id': null, 'mcp_deployment_ref::id': 'github-mcp' },
      ],
    });

    expect([...covered]).toEqual(['gpt-4o', 'github-mcp']);
  });

  test('counts an id once however many rows and refs carry it', () => {
    const covered = parseCoverageRows({
      rows: [
        { 'deployment_ref::id': 'support-bot', 'mcp_deployment_ref::id': null },
        { 'deployment_ref::id': 'support-bot', 'mcp_deployment_ref::id': null },
        { 'deployment_ref::id': null, 'mcp_deployment_ref::id': 'support-bot' },
      ],
    });

    expect(covered.size).toBe(1);
  });

  test('ignores empty, missing and non-string ids', () => {
    const covered = parseCoverageRows({
      rows: [{ 'deployment_ref::id': '', 'mcp_deployment_ref::id': 7 }, {}],
    });

    expect(covered.size).toBe(0);
  });

  test('normalizes an encoded id so it matches the plain id', () => {
    const covered = parseCoverageRows({ rows: [{ 'deployment_ref::id': 'Code%20Apps' }] });

    expect(covered.has('Code Apps')).toBe(true);
  });

  test('reads a missing result as no coverage', () => {
    expect(parseCoverageRows(null).size).toBe(0);
  });
});
