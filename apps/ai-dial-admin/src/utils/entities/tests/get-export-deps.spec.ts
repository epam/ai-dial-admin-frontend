import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { EntityType } from '@/src/types/entity-type';
import { describe, expect, test } from 'vitest';
import { getAllAvailableDependencies, DEPLOYMENT_IMAGE_DEP } from '../get-export-deps';

describe('Export Config Utils :: getAllAvailableDependencies', () => {
  test('returns correct dependencies for ROLE', () => {
    const result = getAllAvailableDependencies(EntityType.ROLE);
    expect(result).toEqual([
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.TOOLSET,
      EntityType.ROUTE,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ]);
  });

  test('returns correct dependencies for KEY', () => {
    const result = getAllAvailableDependencies(EntityType.KEY);
    expect(result).toEqual([
      EntityType.ROLE,
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ]);
  });

  test('returns correct dependencies for MODEL', () => {
    expect(getAllAvailableDependencies(EntityType.MODEL, false)).toEqual([EntityType.ADAPTER, EntityType.INTERCEPTOR]);
    expect(getAllAvailableDependencies(EntityType.MODEL, true)).toEqual([EntityType.INTERCEPTOR]);
  });

  test('returns correct dependencies for APPLICATION_TYPE_SCHEMA', () => {
    const result = getAllAvailableDependencies(EntityType.APPLICATION_TYPE_SCHEMA);
    expect(result).toEqual([EntityType.INTERCEPTOR]);
  });

  test('returns correct dependencies for APPLICATION', () => {
    const result = getAllAvailableDependencies(EntityType.APPLICATION);
    expect(result).toEqual([EntityType.APPLICATION_TYPE_SCHEMA, EntityType.INTERCEPTOR]);
  });

  test('returns empty array for undefined input', () => {
    const result = getAllAvailableDependencies(undefined);
    expect(result).toEqual([]);
  });

  test('returns empty array for unsupported type', () => {
    const result = getAllAvailableDependencies('UNKNOWN' as EntityType);
    expect(result).toEqual([]);
  });

  test('returns MCP_IMAGE dependency for MCP_CONTAINER', () => {
    const result = getAllAvailableDependencies(DeploymentExportEntityType.MCP_CONTAINER as unknown as EntityType);
    expect(result).toEqual([DEPLOYMENT_IMAGE_DEP.MCP]);
  });

  test('returns INTERCEPTOR_IMAGE dependency for INTERCEPTOR_CONTAINER', () => {
    const result = getAllAvailableDependencies(
      DeploymentExportEntityType.INTERCEPTOR_CONTAINER as unknown as EntityType,
    );
    expect(result).toEqual([DEPLOYMENT_IMAGE_DEP.INTERCEPTOR]);
  });

  test('returns ADAPTER_IMAGE dependency for ADAPTER_CONTAINER', () => {
    const result = getAllAvailableDependencies(DeploymentExportEntityType.ADAPTER_CONTAINER as unknown as EntityType);
    expect(result).toEqual([DEPLOYMENT_IMAGE_DEP.ADAPTER]);
  });

  test('returns empty array for MODEL_SERVING', () => {
    const result = getAllAvailableDependencies(DeploymentExportEntityType.MODEL_SERVING as unknown as EntityType);
    expect(result).toEqual([]);
  });

  test('returns empty array for IMAGE', () => {
    const result = getAllAvailableDependencies(DeploymentExportEntityType.IMAGE as unknown as EntityType);
    expect(result).toEqual([]);
  });
});
