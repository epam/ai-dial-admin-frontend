'use server';

import { cookies, headers } from 'next/headers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { Image } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import { containersApi, huggingFaceApi, imagesApi, topicApi, whitelistApi } from '@/src/app/api/api';

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

export async function getImageLogs(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImageLogs(id, token);
}

export async function getTopics() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return topicApi.getTopics(token);
}

export async function getContainers(type: string) {
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

export async function getGlobalWhitelist() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return whitelistApi.getGlobalWhitelist(token);
}

export async function updateGlobalWhitelist(domainList: string[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return whitelistApi.updateGlobalWhitelist(domainList, token);
}

export async function getHuggingFaceModels(params: Record<string, string>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return huggingFaceApi.getHuggingFaceModels(params, token);
}
export async function getModelDetails(modelName: string, sha: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return huggingFaceApi.getModelDetails(modelName, sha, token);
}
