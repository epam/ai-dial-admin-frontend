import { describe, expect, test } from 'vitest';

import {
  ActivityAuditResourceType,
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
