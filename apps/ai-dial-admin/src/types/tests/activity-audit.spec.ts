import { describe, expect, test } from 'vitest';

import {
  ActivityAuditResourceType,
  hasChildResourceActivities,
  isAnalyticsResource,
  isContainerDeploymentResource,
  isDeploymentManagerResource,
  isGlobalFirewallResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';

describe('activity-audit predicates :: isImageDefinitionResource', () => {
  test.each([
    ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
  ])('returns true for %s', (type) => {
    expect(isImageDefinitionResource(type)).toBe(true);
  });

  test.each([
    ActivityAuditResourceType.MODEL,
    ActivityAuditResourceType.APPLICATION,
    ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
    ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
  ])('returns false for %s', (type) => {
    expect(isImageDefinitionResource(type)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isImageDefinitionResource(undefined)).toBe(false);
  });
});

describe('activity-audit predicates :: isGlobalFirewallResource', () => {
  test('returns true for ImageBuildDomainWhitelist', () => {
    expect(isGlobalFirewallResource(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST)).toBe(true);
  });

  test.each([
    ActivityAuditResourceType.MODEL,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
    ActivityAuditResourceType.MCP_DEPLOYMENT,
  ])('returns false for %s', (type) => {
    expect(isGlobalFirewallResource(type)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isGlobalFirewallResource(undefined)).toBe(false);
  });
});

describe('activity-audit predicates :: isDeploymentManagerResource', () => {
  const deploymentManagerTypes = [
    ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
    ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
    ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
    ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
    ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
    ActivityAuditResourceType.MCP_DEPLOYMENT,
    ActivityAuditResourceType.NIM_DEPLOYMENT,
    ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
  ];

  test.each(deploymentManagerTypes)('returns true for %s', (type) => {
    expect(isDeploymentManagerResource(type)).toBe(true);
  });

  test('covers all eleven deployment-manager resource types', () => {
    expect(deploymentManagerTypes).toHaveLength(11);
  });

  test.each([
    ActivityAuditResourceType.MODEL,
    ActivityAuditResourceType.APPLICATION,
    ActivityAuditResourceType.ADAPTER,
    ActivityAuditResourceType.ROLE,
    ActivityAuditResourceType.ROUTE,
    ActivityAuditResourceType.KEY,
    ActivityAuditResourceType.TOOLSET,
  ])('returns false for admin-backend %s', (type) => {
    expect(isDeploymentManagerResource(type)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isDeploymentManagerResource(undefined)).toBe(false);
  });
});

describe('activity-audit predicates :: isContainerDeploymentResource', () => {
  test.each([
    ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
    ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
    ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
    ActivityAuditResourceType.MCP_DEPLOYMENT,
    ActivityAuditResourceType.NIM_DEPLOYMENT,
    ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
  ])('returns true for %s', (type) => {
    expect(isContainerDeploymentResource(type)).toBe(true);
  });

  test.each([
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
    ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
  ])('returns false for non-container deployment-manager type %s', (type) => {
    expect(isContainerDeploymentResource(type)).toBe(false);
  });

  test.each([
    ActivityAuditResourceType.MODEL,
    ActivityAuditResourceType.APPLICATION,
    ActivityAuditResourceType.ADAPTER,
    ActivityAuditResourceType.ROLE,
  ])('returns false for admin-backend %s', (type) => {
    expect(isContainerDeploymentResource(type)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isContainerDeploymentResource(undefined)).toBe(false);
  });
});

describe('activity-audit predicates :: isAnalyticsResource', () => {
  const analyticsTypes = [
    ActivityAuditResourceType.TABLE,
    ActivityAuditResourceType.TABLE_COLUMN,
    ActivityAuditResourceType.PIPELINE,
    ActivityAuditResourceType.SAVED_QUERY,
  ];

  test.each(analyticsTypes)('returns true for %s', (type) => {
    expect(isAnalyticsResource(type)).toBe(true);
  });

  test('covers the four PascalCase values the analytics backend emits', () => {
    expect(analyticsTypes).toEqual(['Table', 'TableColumn', 'Pipeline', 'SavedQuery']);
  });

  test.each([
    ActivityAuditResourceType.MODEL,
    ActivityAuditResourceType.APPLICATION,
    ActivityAuditResourceType.ROLE,
    ActivityAuditResourceType.TOOLSET,
  ])('returns false for admin-backend %s', (type) => {
    expect(isAnalyticsResource(type)).toBe(false);
  });

  test.each([
    ActivityAuditResourceType.MCP_DEPLOYMENT,
    ActivityAuditResourceType.NIM_DEPLOYMENT,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
    ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
  ])('returns false for deployment-manager %s', (type) => {
    expect(isAnalyticsResource(type)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isAnalyticsResource(undefined)).toBe(false);
  });

  test.each(analyticsTypes)('leaves the existing resource-set predicates answering false for %s', (type) => {
    expect(isDeploymentManagerResource(type)).toBe(false);
    expect(isContainerDeploymentResource(type)).toBe(false);
    expect(isImageDefinitionResource(type)).toBe(false);
    expect(isGlobalFirewallResource(type)).toBe(false);
  });
});

describe('activity-audit predicates :: hasChildResourceActivities', () => {
  test('returns true for Table', () => {
    expect(hasChildResourceActivities(ActivityAuditResourceType.TABLE)).toBe(true);
  });

  test.each([
    ActivityAuditResourceType.TABLE_COLUMN,
    ActivityAuditResourceType.PIPELINE,
    ActivityAuditResourceType.SAVED_QUERY,
    ActivityAuditResourceType.MODEL,
    ActivityAuditResourceType.MCP_DEPLOYMENT,
  ])('returns false for %s', (type) => {
    expect(hasChildResourceActivities(type)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(hasChildResourceActivities(undefined)).toBe(false);
  });

  test('holds no deployment-manager or admin-backend type, so a later addition fails here first', () => {
    const nonParentTypes = Object.values(ActivityAuditResourceType).filter(
      (type) => type !== ActivityAuditResourceType.TABLE,
    );

    nonParentTypes.forEach((type) => {
      expect(hasChildResourceActivities(type)).toBe(false);
    });
  });
});
