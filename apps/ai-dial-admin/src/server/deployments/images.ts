import { Token } from '@/src/models/auth';
import { Image } from '@/src/models/deployments/images';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { ActivityAuditEntity } from '@/src/types/activity-audit';

export const BASE_IMAGES_URL = `${API}/images`;
export const IMAGES_URL = `${BASE_IMAGES_URL}/definitions`;
export const INSTALL_IMAGES_URL = `${BASE_IMAGES_URL}/builds`;
export const IMAGE_URL = (id?: string) => `${IMAGES_URL}/${id || ''}`;
export const IMAGE_VERSIONS_URL = (id: string, type: string) => `${IMAGES_URL}/${id}/versions?type=${type}`;
export const IMAGE_LOGS_URL = (id: string) => `${INSTALL_IMAGES_URL}/${id}/logs`;
export const IMAGES_WITH_VERSIONS = (type: string) => `${IMAGES_URL}/grouped?type=${type}`;
export const IMAGE_ROLLBACK_URL = (id: string, revision: number) => `${IMAGES_URL}/${id}/revision/${revision}/rollback`;

export class ImagesApi extends BaseApi {
  getImages(token: Token): Promise<ServerActionResponse> {
    return this.getAction(`${IMAGES_URL}`, token);
  }

  getImage(id: string, token: Token): Promise<ServerActionResponse> {
    return this.getAction(IMAGE_URL(id), token);
  }

  getRevisionDetails(url: string, token: Token): Promise<ActivityAuditEntity | null> {
    return this.get(`${API}${url}`, token);
  }

  getImageVersions(name: string, type: string, token: Token): Promise<ServerActionResponse> {
    return this.getAction(IMAGE_VERSIONS_URL(name, type), token);
  }

  getImagesWithVersions(type: string, token: Token): Promise<ServerActionResponse> {
    return this.getAction(IMAGES_WITH_VERSIONS(type), token);
  }

  createImage(server: Partial<Image>, token: Token): Promise<ServerActionResponse> {
    return this.postAction(IMAGES_URL, server, token);
  }

  deleteImage(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(IMAGE_URL(id), token);
  }

  rollbackImage(id: string, revision: number, token: Token): Promise<ServerActionResponse> {
    return this.postAction(IMAGE_ROLLBACK_URL(id, revision), {}, token);
  }

  updateImage(server: Partial<Image>, token: Token): Promise<ServerActionResponse> {
    const { id, ...rest } = server;
    return this.putAction(IMAGE_URL(id), rest, token);
  }

  installImage(id: string, token: Token): Promise<ServerActionResponse> {
    return this.postAction(INSTALL_IMAGES_URL, { imageDefinitionId: id }, token);
  }

  stopBuild(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(`${INSTALL_IMAGES_URL}/${id}`, token);
  }

  getImageLogs(id: string, token: Token): Promise<Image | null> {
    return this.get(IMAGE_LOGS_URL(id), token);
  }
}
