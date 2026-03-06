import { describe, expect, test } from 'vitest';

import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { DeploymentExportComponentType, DeploymentExportEntityType } from '@/src/types/deployments/export';
import { getDeploymentExportComponentType } from '../export';

describe('Utils :: getDeploymentExportComponentType', () => {
  describe('container types', () => {
    test('maps MCP container to MCP_DEPLOYMENT', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.MCP_CONTAINER, CONTAINER_TYPE.MCP);
      expect(result).toBe(DeploymentExportComponentType.MCP_DEPLOYMENT);
    });

    test('maps INTERCEPTOR container to INTERCEPTOR_DEPLOYMENT', () => {
      const result = getDeploymentExportComponentType(
        DeploymentExportEntityType.INTERCEPTOR_CONTAINER,
        CONTAINER_TYPE.INTERCEPTOR,
      );
      expect(result).toBe(DeploymentExportComponentType.INTERCEPTOR_DEPLOYMENT);
    });

    test('maps ADAPTER container to ADAPTER_DEPLOYMENT', () => {
      const result = getDeploymentExportComponentType(
        DeploymentExportEntityType.ADAPTER_CONTAINER,
        CONTAINER_TYPE.ADAPTER,
      );
      expect(result).toBe(DeploymentExportComponentType.ADAPTER_DEPLOYMENT);
    });

    test('maps NIM container to NIM_DEPLOYMENT', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.MODEL_SERVING, CONTAINER_TYPE.NIM);
      expect(result).toBe(DeploymentExportComponentType.NIM_DEPLOYMENT);
    });

    test('maps HF container to INFERENCE_DEPLOYMENT', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.MODEL_SERVING, CONTAINER_TYPE.HF);
      expect(result).toBe(DeploymentExportComponentType.INFERENCE_DEPLOYMENT);
    });

    test('falls back to MCP_DEPLOYMENT for unknown container subType', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.MCP_CONTAINER, 'unknown');
      expect(result).toBe(DeploymentExportComponentType.MCP_DEPLOYMENT);
    });
  });

  describe('image types', () => {
    test('maps MCP image to MCP_IMAGE_DEFINITION', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.IMAGE, IMAGE_TYPE.MCP);
      expect(result).toBe(DeploymentExportComponentType.MCP_IMAGE_DEFINITION);
    });

    test('maps ADAPTER image to ADAPTER_IMAGE_DEFINITION', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.IMAGE, IMAGE_TYPE.ADAPTER);
      expect(result).toBe(DeploymentExportComponentType.ADAPTER_IMAGE_DEFINITION);
    });

    test('maps INTERCEPTOR image to INTERCEPTOR_IMAGE_DEFINITION', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.IMAGE, IMAGE_TYPE.INTERCEPTOR);
      expect(result).toBe(DeploymentExportComponentType.INTERCEPTOR_IMAGE_DEFINITION);
    });

    test('falls back to MCP_IMAGE_DEFINITION for unknown image subType', () => {
      const result = getDeploymentExportComponentType(DeploymentExportEntityType.IMAGE, 'unknown');
      expect(result).toBe(DeploymentExportComponentType.MCP_IMAGE_DEFINITION);
    });
  });
});
