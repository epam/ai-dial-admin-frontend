import { describe, expect, test } from 'vitest';

import { parseCoverageRows } from '@/src/components/EvalSystemHealth/utils/parse-coverage-rows';

describe('parseCoverageRows', () => {
  test('collects the ids of both deployment refs into the deployment set', () => {
    const covered = parseCoverageRows({
      rows: [
        { 'deployment_ref::id': 'gpt-4o', 'mcp_deployment_ref::id': null },
        { 'deployment_ref::id': null, 'mcp_deployment_ref::id': 'github-mcp' },
      ],
    });

    expect([...covered.deployments]).toEqual(['gpt-4o', 'github-mcp']);
    expect(covered.routes.size).toBe(0);
  });

  test('collects the route ref into the route set, apart from the deployments', () => {
    const covered = parseCoverageRows({
      rows: [
        { 'deployment_ref::id': 'gpt-4o', 'routes_ref::name': null },
        { 'deployment_ref::id': null, 'routes_ref::name': 'routes/platform/echo' },
      ],
    });

    expect([...covered.deployments]).toEqual(['gpt-4o']);
    expect([...covered.routes]).toEqual(['echo']);
  });

  test('stores a route name without the platform prefix, and leaves a plain one as it is', () => {
    const covered = parseCoverageRows({
      rows: [{ 'routes_ref::name': 'routes/platform/echo' }, { 'routes_ref::name': 'proxy' }],
    });

    expect([...covered.routes]).toEqual(['echo', 'proxy']);
  });

  test('counts a route written prefixed and plain once', () => {
    const covered = parseCoverageRows({
      rows: [{ 'routes_ref::name': 'routes/platform/echo' }, { 'routes_ref::name': 'echo' }],
    });

    expect(covered.routes.size).toBe(1);
  });

  test('counts an id once however many rows and refs carry it', () => {
    const covered = parseCoverageRows({
      rows: [
        { 'deployment_ref::id': 'support-bot', 'mcp_deployment_ref::id': null },
        { 'deployment_ref::id': 'support-bot', 'mcp_deployment_ref::id': null },
        { 'deployment_ref::id': null, 'mcp_deployment_ref::id': 'support-bot' },
      ],
    });

    expect(covered.deployments.size).toBe(1);
  });

  test('ignores empty, missing and non-string values', () => {
    const covered = parseCoverageRows({
      rows: [{ 'deployment_ref::id': '', 'mcp_deployment_ref::id': 7, 'routes_ref::name': '' }, {}],
    });

    expect(covered.deployments.size).toBe(0);
    expect(covered.routes.size).toBe(0);
  });

  test('normalizes an encoded id so it matches the plain id', () => {
    const covered = parseCoverageRows({ rows: [{ 'deployment_ref::id': 'Code%20Apps' }] });

    expect(covered.deployments.has('Code Apps')).toBe(true);
  });

  test('keeps a route name equal to a deployment id out of the deployment set', () => {
    const covered = parseCoverageRows({ rows: [{ 'routes_ref::name': 'routes/platform/shared-name' }] });

    expect(covered.deployments.has('shared-name')).toBe(false);
    expect(covered.routes.has('shared-name')).toBe(true);
  });

  test('reads a missing result as no coverage', () => {
    const covered = parseCoverageRows(null);

    expect(covered.deployments.size).toBe(0);
    expect(covered.routes.size).toBe(0);
  });
});
