'use server';

import { cookies, headers } from 'next/headers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { Image } from '@/src/models/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import {
  assetsApi,
  containersApi,
  foldersApi,
  imagesApi,
  interceptorsApi,
  modelsApi,
  toolSetsApi,
  topicApi,
} from '@/src/app/api/api';
import { ResourceType } from '@/src/types/resource-type';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { Toolset } from '@/src/models/dial/toolset';
import { DialModel } from '@/src/models/dial/model';
import { AssetToolset } from '@/src/models/dial/deployment-asset';

export async function getMCPImages() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getMCPImages(token);
}

export async function getInterceptorImages() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getInterceptorImages(token);
}

export async function getModelImages() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getModelImages(token);
}

export async function getImage(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImage(id, token);
}

export async function getImageVersions(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return imagesApi.getImageVersions(name, token);
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

export async function duplicateContainer(id: string, name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return containersApi.duplicateContainer(id, name, token);
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

export async function createInterceptor(interceptor: DialInterceptor) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.createInterceptor(interceptor, token);
}

export async function createToolset(toolset: Toolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.createToolset(toolset, token);
}

export async function createModel(model: DialModel) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.createModel(model, token);
}

export async function getInterceptorsList() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.getInterceptorsList(token);
}

export async function getModelsList() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getModelsList(token);
}

export async function getToolsetList() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.getToolsetList(token);
}

export async function getFolders(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return foldersApi.getFolders(token, path);
}

export async function getRules(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return foldersApi.getRules(token, path);
}

export async function getFiles(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.FILE);
}

export async function getToolsets(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.TOOLSET);
}

export async function createAssetToolset(toolset: AssetToolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.createAsset(toolset, ResourceType.TOOLSET, token);
}
