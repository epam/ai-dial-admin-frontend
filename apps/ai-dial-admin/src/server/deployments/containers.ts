import { Token } from '@/src/models/auth';
import { Container, Pod, Prompt, Resource } from '@/src/models/deployments/containers';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { encodeVariables } from '@/src/utils/deployments/variables';

export const BASE_CONTAINERS_URL = `${API}/deployments`;
export const SERVER_CONTAINERS_URL = (id: string) => `${BASE_CONTAINERS_URL}?imageDefinitionId=${id}`;
export const CONTAINER_URL = (id?: string) => `${BASE_CONTAINERS_URL}/${id || ''}`;
export const DUPLICATE_CONTAINER_URL = `${BASE_CONTAINERS_URL}/duplicate`;
export const RUN_CONTAINER_URL = (id: string) => `${BASE_CONTAINERS_URL}/${id}/deploy`;
export const STOP_CONTAINER_URL = (id: string) => `${BASE_CONTAINERS_URL}/${id}/undeploy`;
export const CONTAINER_DETAILS_URL = `${BASE_CONTAINERS_URL}/mcp`;
export const CONTAINER_TOOLS_URL = (id: string) => `${CONTAINER_DETAILS_URL}/${id}/tools`;
export const CONTAINER_RESOURCES_URL = (id: string) => `${CONTAINER_DETAILS_URL}/${id}/resources`;
export const CONTAINER_PROMPTS_URL = (id: string) => `${CONTAINER_DETAILS_URL}/${id}/prompts`;
export const CONTAINER_PODS_URL = (id: string) => `${BASE_CONTAINERS_URL}/${id}/pods`;
export const CONTAINER_LOGS_URL = (containerId: string, podId: string) =>
  `${BASE_CONTAINERS_URL}/${containerId}/pods/${podId}/logs`;
export const CONTAINER_EVENTS_URL = (containerId?: string) =>
  `${BASE_CONTAINERS_URL}/${containerId || ''}/events/stream`;
export const CHANGE_IMAGE_ID = `${BASE_CONTAINERS_URL}/change-image`;

export class ContainersApi extends BaseApi {
  getContainers(type: string, token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(`${BASE_CONTAINERS_URL}?type=${type}`, token);
  }

  getMCPContainers(token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(`${BASE_CONTAINERS_URL}?type=MCP`, token);
  }

  getInterceptorContainers(token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(`${BASE_CONTAINERS_URL}?type=INTERCEPTOR`, token);
  }

  getAdapterContainers(token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(`${BASE_CONTAINERS_URL}?type=ADAPTER`, token);
  }

  getModelContainers(token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(`${BASE_CONTAINERS_URL}?type=NIM,INFERENCE`, token);
  }

  getImageContainers(imageId: string, token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(SERVER_CONTAINERS_URL(imageId), token);
  }

  getContainer(id: string, token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(CONTAINER_URL(id), token);
  }

  createContainer(container: Container, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(BASE_CONTAINERS_URL, encodeVariables(container), token);
  }

  duplicateContainer(
    sourceDeploymentName: string,
    newDeploymentName: string,
    newDeploymentDisplayName: string,
    token: Token | undefined,
  ): Promise<ServerActionResponse> {
    return this.postAction(
      DUPLICATE_CONTAINER_URL,
      { sourceDeploymentName, newDeploymentName, newDeploymentDisplayName },
      token,
    );
  }

  updateContainer(container: Container, token: Token | undefined): Promise<ServerActionResponse> {
    return this.putAction(CONTAINER_URL(container.name), encodeVariables(container), token);
  }

  updateContainersImageId(
    deployments: string[],
    imageDefinitionId: string,
    token: Token | undefined,
  ): Promise<ServerActionResponse> {
    return this.postAction(CHANGE_IMAGE_ID, { deployments, imageDefinitionId }, token);
  }

  deleteContainer(containerId: string, token: Token | undefined): Promise<ServerActionResponse> {
    return this.deleteAction(CONTAINER_URL(containerId), token);
  }

  runContainer(containerId: string, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(RUN_CONTAINER_URL(containerId), {}, token);
  }

  stopContainer(containerId: string, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(STOP_CONTAINER_URL(containerId), {}, token);
  }

  getContainerTools(containerId: string, token: Token | undefined): Promise<ServerActionResponse> {
    return this.getAction(CONTAINER_TOOLS_URL(containerId), token);
  }

  getContainerResources(containerId: string, token: Token | undefined): Promise<{ resources: Resource[] } | null> {
    return this.get(CONTAINER_RESOURCES_URL(containerId), token);
  }

  getContainerPrompts(containerId: string, token: Token | undefined): Promise<{ prompts: Prompt[] } | null> {
    return this.get(CONTAINER_PROMPTS_URL(containerId), token);
  }

  getContainerPods(containerId: string, token: Token | undefined): Promise<Pod[] | null> {
    return this.get(CONTAINER_PODS_URL(containerId), token);
  }

  getContainerLogs(containerId: string, podId: string, token: Token | undefined): Promise<string[] | null> {
    return this.get(CONTAINER_LOGS_URL(containerId, podId), token);
  }
}
