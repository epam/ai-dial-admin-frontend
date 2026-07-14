import { describe, expect, test } from 'vitest';

import { Deployment } from '@/src/models/evaluation/deployment';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { TargetTab } from '../types';
import { buildDeploymentUpdate, buildMcpDeploymentUpdate, getInitialTab } from '../utils';

describe('Target utils', () => {
  describe('buildDeploymentUpdate', () => {
    test('should build deployment update with correct fields', () => {
      const deployment: Deployment = {
        $type: 'dial-application',
        deploymentId: 'app-1',
        displayName: 'My App',
        version: '1.0',
      };

      const result = buildDeploymentUpdate(deployment);

      expect(result).toEqual({
        suiteType: SuiteType.Deployment,
        deploymentRef: {
          id: 'app-1',
          name: 'My App',
          version: '1.0',
          type: 'dial-application',
        },
        endpointRef: void 0,
        mcpDeploymentRef: void 0,
        toolRef: void 0,
        argumentTemplate: void 0,
      });
    });
  });

  describe('buildMcpDeploymentUpdate', () => {
    test('should build MCP deployment update with correct fields', () => {
      const deployment: Deployment = {
        $type: 'dial-toolset',
        deploymentId: 'mcp-1',
        displayName: 'My Toolset',
      };

      const result = buildMcpDeploymentUpdate(deployment);

      expect(result).toEqual({
        suiteType: SuiteType.McpTool,
        mcpDeploymentRef: {
          id: 'mcp-1',
          type: 'dial-toolset',
          name: 'My Toolset',
        },
        deploymentRef: void 0,
        endpointRef: void 0,
        requestTemplate: void 0,
        toolRef: void 0,
      });
    });

    test('should fallback to deploymentId when displayName is missing', () => {
      const deployment: Deployment = {
        $type: 'dial-toolset',
        deploymentId: 'mcp-2',
      };

      const result = buildMcpDeploymentUpdate(deployment);

      expect(result.mcpDeploymentRef?.name).toBe('mcp-2');
    });
  });

  describe('getInitialTab', () => {
    test('should return Mcp tab for MCP_TOOL suite type', () => {
      expect(getInitialTab(SuiteType.McpTool)).toBe(TargetTab.Mcp);
    });

    test('should return Applications tab for DEPLOYMENT suite type', () => {
      expect(getInitialTab(SuiteType.Deployment)).toBe(TargetTab.Applications);
    });

    test('should return Applications tab when suite type is undefined', () => {
      expect(getInitialTab(undefined)).toBe(TargetTab.Applications);
    });
  });
});
