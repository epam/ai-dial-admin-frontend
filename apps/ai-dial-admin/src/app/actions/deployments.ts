'use server';

import { cookies, headers } from 'next/headers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { Image } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import {
  containersApi,
  globalFirewallApi,
  huggingFaceApi,
  imagesApi,
  mcpRegistryApi,
  nodePoolsApi,
  topicApi,
  whitelistApi,
} from '@/src/app/api/api';
import {
  ActivityAuditEntity,
  isContainerDeploymentResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { DeploymentEntityState } from '@/src/models/deployments/rollback';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';
import { unwrapSingleServerResponse } from '@/src/utils/deployments/mcp-registry';

export async function getImages() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImages(token);
}

export async function getImage(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImage(id, token);
}

export async function getImageVersions(name: string, type: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImageVersions(name, type, token);
}

export async function getImagesWithVersions(type: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImagesWithVersions(type, token);
}

export async function createImage(server: Partial<Image>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.createImage(server, token);
}

export async function deleteImage(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.deleteImage(id, token);
}

export async function updateImage(server: Partial<Image>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.updateImage(server, token);
}

export async function installImage(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.installImage(id, token);
}

export async function stopBuild(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.stopBuild(id, token);
}

export async function getImageLogs(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImageLogs(id, token);
}

export async function getTopics() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return topicApi.getTopics(token);
}

export async function getNodePools() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return nodePoolsApi.getNodePools(token);
}

export async function getContainers(type?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getContainers(type, token);
}

export async function getMCPContainers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getMCPContainers(token);
}

export async function getInterceptorContainers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getInterceptorContainers(token);
}

export async function getAdapterContainers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getAdapterContainers(token);
}

export async function getApplicationContainers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getApplicationContainers(token);
}

export async function getModelContainers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getModelContainers(token);
}

export async function getImageContainers(imageId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getImageContainers(imageId, token);
}

export async function getContainer(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getContainer(id, token);
}

export async function createContainer(instance: Container) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.createContainer(instance, token);
}

export async function duplicateContainer(name: string, newName: string, newDisplayName: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.duplicateContainer(name, newName, newDisplayName, token);
}

export async function updateContainer(container: Container) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.updateContainer(container, token);
}

export async function updateContainersImageId(deployments: string[], imageDefinitionId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.updateContainersImageId(deployments, imageDefinitionId, token);
}

export async function deleteContainer(containerId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.deleteContainer(containerId, token);
}

export async function runContainer(containerId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.runContainer(containerId, token);
}

export async function stopContainer(containerId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.stopContainer(containerId, token);
}

export async function getContainerTools(containerId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getContainerTools(containerId, token);
}

export async function tryOutContainerTool(containerId: string, body: Record<string, unknown>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.callContainerTool(containerId, body, token);
}

export async function getContainerResources(containerId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getContainerResources(containerId, token);
}

export async function getContainerPrompts(containerId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getContainerPrompts(containerId, token);
}

export async function getContainerPods(containerId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.getContainerPods(containerId, token);
}

export async function rollbackDeploymentContainer(id: string, revision: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.rollbackContainer(id, revision, token);
}

export async function rollbackDeploymentImage(id: string, revision: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.rollbackImage(id, revision, token);
}

export async function rollbackDeploymentWhitelist(revision: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return globalFirewallApi.rollbackWhitelist(revision, token);
}

export async function getDeploymentRevisionDetails(
  resourceType: string,
  resourceId: string,
  revision: number,
): Promise<ActivityAuditEntity | null> {
  if (revision < 0) {
    return null;
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const route = getRevisionRouteForEntityType(resourceType, decodeURIComponent(resourceId));
  if (!route) {
    return null;
  }
  if (isImageDefinitionResource(resourceType)) {
    return imagesApi.getRevisionDetails(`${route}${revision}`, token);
  }
  if (isContainerDeploymentResource(resourceType)) {
    return containersApi.getRevisionDetails(`${route}${revision}`, token);
  }
  return null;
}

export async function getDeploymentEntityState(
  resourceType: string,
  id: string,
): Promise<DeploymentEntityState | null> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  if (isContainerDeploymentResource(resourceType)) {
    const res = await containersApi.getContainer(id, token);
    return res?.success ? { status: (res.response as Container)?.status } : null;
  }
  if (isImageDefinitionResource(resourceType)) {
    const res = await imagesApi.getImage(id, token);
    return res?.success ? { buildStatus: (res.response as Image)?.buildStatus } : null;
  }
  return null;
}

export async function getGlobalWhitelist() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return whitelistApi.getGlobalWhitelist(token);
}

export async function updateGlobalWhitelist(domainList: string[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return whitelistApi.updateGlobalWhitelist(domainList, token);
}

export async function getContainerMcpServers(params: {
  search?: string;
  cursor?: string;
  limit?: number;
  minResults?: number;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const { minResults, ...requestParams } = params;

  if (!minResults) {
    return mcpRegistryApi.getContainerMcpServers(requestParams, token);
  }

  const allServers: unknown[] = [];
  let cursor = params.cursor;

  while (allServers.length < minResults) {
    const result = await mcpRegistryApi.getContainerMcpServers({ ...requestParams, cursor }, token);
    if (!result.success) return result;

    const servers = result.response?.servers ?? [];
    allServers.push(...servers);

    cursor = result.response?.metadata?.nextCursor;
    if (!cursor) break;
  }

  return {
    success: true,
    response: {
      servers: allServers,
      metadata: { nextCursor: cursor },
    },
  };
}

export async function getImageMcpServers(params: {
  search?: string;
  cursor?: string;
  limit?: number;
  minResults?: number;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const { minResults, ...requestParams } = params;

  const fetchMerged = async (fetchParams: { search?: string; cursor?: string; limit?: number }) => {
    const [repoResult, ociResult] = await Promise.all([
      mcpRegistryApi.getImageMcpServersByRepo(fetchParams, token),
      mcpRegistryApi.getImageMcpServersByOci(fetchParams, token),
    ]);

    if (!repoResult.success) return repoResult;
    if (!ociResult.success) return ociResult;

    const repoServers = repoResult.response?.servers ?? [];
    const ociServers = ociResult.response?.servers ?? [];

    const seen = new Set<string>();
    const merged: unknown[] = [];
    for (const s of [...repoServers, ...ociServers]) {
      const server = (s as { server: { name: string; version: string } }).server;
      const key = `${server.name}:${server.version}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(s);
      }
    }

    const nextCursor = repoResult.response?.metadata?.nextCursor || ociResult.response?.metadata?.nextCursor;
    return { success: true as const, response: { servers: merged, metadata: { nextCursor } } };
  };

  if (!minResults) {
    return fetchMerged(requestParams);
  }

  const allServers: unknown[] = [];
  let cursor = params.cursor;

  while (allServers.length < minResults) {
    const result = await fetchMerged({ ...requestParams, cursor });
    if (!result.success) return result;

    const servers = result.response?.servers ?? [];
    allServers.push(...servers);

    cursor = result.response?.metadata?.nextCursor;
    if (!cursor) break;
  }

  return {
    success: true,
    response: {
      servers: allServers,
      metadata: { nextCursor: cursor },
    },
  };
}

export async function getToolsetMcpServers(params: {
  search?: string;
  cursor?: string;
  limit?: number;
  minResults?: number;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const { minResults, ...requestParams } = params;

  if (!minResults) {
    return mcpRegistryApi.getToolsetMcpServers(requestParams, token);
  }

  const allServers: unknown[] = [];
  let cursor = params.cursor;

  while (allServers.length < minResults) {
    const result = await mcpRegistryApi.getToolsetMcpServers({ ...requestParams, cursor }, token);
    if (!result.success) return result;

    const servers = result.response?.servers ?? [];
    allServers.push(...servers);

    cursor = result.response?.metadata?.nextCursor;
    if (!cursor) break;
  }

  return {
    success: true,
    response: {
      servers: allServers,
      metadata: { nextCursor: cursor },
    },
  };
}

export async function getMcpServerVersion(serverName: string, version: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const result = await mcpRegistryApi.getMcpServerVersion(serverName, version, token);
  return unwrapSingleServerResponse(result);
}

export async function getHuggingFaceModels(params: Record<string, string>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return huggingFaceApi.getHuggingFaceModels(params, token);
}
export async function getModelDetails(modelName: string, sha: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return huggingFaceApi.getModelDetails(modelName, sha, token);
}
