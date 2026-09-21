import { describe, expect, test } from 'vitest';

import { CREATE_MESSAGE_METHOD } from '@/src/components/TestSuites/constants/anthropic-messages-method';
import { CREATE_RESPONSE_METHOD } from '@/src/components/TestSuites/constants/responses-method';
import { Deployment } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { TargetTab } from '../types';
import { applyTargetSelection, buildDeploymentUpdate, buildMcpDeploymentUpdate, getInitialTab } from '../utils';

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
        mcpDeploymentRef: void 0,
        toolRef: void 0,
        argumentTemplate: void 0,
      });
    });

    test('does not clear endpointRef or requestTemplate', () => {
      const deployment: Deployment = {
        $type: 'dial-application',
        deploymentId: 'app-1',
        displayName: 'My App',
      };

      const result = buildDeploymentUpdate(deployment);

      expect(result).not.toHaveProperty('endpointRef');
      expect(result).not.toHaveProperty('requestTemplate');
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

  describe('applyTargetSelection', () => {
    const deployment: Deployment = {
      $type: 'dial-model',
      deploymentId: 'new-model',
      displayName: 'New model',
    };

    test('updates the deployment and reseeds matching requests throughout the chain', () => {
      const suite = {
        endpointRef: CREATE_RESPONSE_METHOD,
        requestTemplate: { body: { content: { model: 'old-model', input: 'hello', store: true } } },
        additionalRequests: [
          {
            name: 'anthropic',
            endpointRef: CREATE_MESSAGE_METHOD,
            requestTemplate: {
              body: { content: { model: 'old-model', max_tokens: 1024, messages: [] } },
            },
          },
          {
            name: 'route',
            endpointRef: { method: 'POST', relativeUrlPattern: '/custom' },
            requestTemplate: { body: { content: { model: 'custom-model' } } },
          },
        ],
      } as TestSuite;

      const result = applyTargetSelection(suite, deployment, TargetTab.Models);

      expect(result.deploymentRef).toEqual({
        id: 'new-model',
        name: 'New model',
        version: undefined,
        type: 'dial-model',
      });
      expect(result.requestTemplate?.body?.content).toEqual({ model: 'new-model', input: 'hello', store: true });
      expect(result.additionalRequests?.[0].requestTemplate?.body?.content).toEqual({
        model: 'new-model',
        max_tokens: 1024,
        messages: [],
      });
      expect(result.additionalRequests?.[1].requestTemplate?.body?.content).toEqual({ model: 'custom-model' });
    });

    test('leaves unrelated request bodies unchanged', () => {
      const suite = {
        endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
        requestTemplate: { body: { content: { model: 'hand-edited', messages: [] } } },
      } as TestSuite;

      const result = applyTargetSelection(suite, deployment, TargetTab.Applications);

      expect(result.requestTemplate).toBe(suite.requestTemplate);
    });

    test('uses the existing MCP transition without reseeding HTTP requests', () => {
      const suite = {
        endpointRef: CREATE_RESPONSE_METHOD,
        requestTemplate: { body: { content: { model: 'old-model', input: 'hello' } } },
        additionalRequests: [{ endpointRef: CREATE_MESSAGE_METHOD }],
      } as TestSuite;
      const mcpDeployment: Deployment = {
        $type: 'dial-toolset',
        deploymentId: 'mcp-1',
        displayName: 'MCP target',
      };

      const result = applyTargetSelection(suite, mcpDeployment, TargetTab.Mcp);

      expect(result).toMatchObject({
        suiteType: SuiteType.McpTool,
        mcpDeploymentRef: { id: 'mcp-1', name: 'MCP target', type: 'dial-toolset' },
        deploymentRef: undefined,
        endpointRef: undefined,
        requestTemplate: undefined,
      });
      expect(result.additionalRequests).toBe(suite.additionalRequests);
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
