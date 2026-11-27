import { describe, expect, test } from 'vitest';

import { groupDeploymentIds } from '@/src/components/EvalSystemHealth/utils/group-deployment-ids';
import { Deployment } from '@/src/models/evaluation/deployment';

const deployment = ($type: string, deploymentId: string): Deployment => ({ $type, deploymentId });

describe('groupDeploymentIds', () => {
  test('splits one listing into models, applications and toolsets by $type', () => {
    expect(
      groupDeploymentIds([
        deployment('dial-model', 'gpt-4o'),
        deployment('dial-application', 'support-bot'),
        deployment('dial-toolset', 'github'),
        deployment('dial-model', 'claude'),
      ]),
    ).toEqual({ models: ['gpt-4o', 'claude'], applications: ['support-bot'], toolsets: ['github'] });
  });

  test('keeps an application that exposes MCP as an application, not a toolset', () => {
    const grouped = groupDeploymentIds([{ ...deployment('dial-application', 'mcp-app'), interfaces: [] }]);

    expect(grouped.applications).toEqual(['mcp-app']);
    expect(grouped.toolsets).toEqual([]);
  });

  test('leaves out an item of any other type', () => {
    expect(groupDeploymentIds([deployment('dial-assistant', 'old'), deployment('', 'untyped')])).toEqual({
      models: [],
      applications: [],
      toolsets: [],
    });
  });

  test('returns empty groups for an empty listing', () => {
    expect(groupDeploymentIds([])).toEqual({ models: [], applications: [], toolsets: [] });
  });
});
