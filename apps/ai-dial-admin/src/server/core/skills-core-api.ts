import { CORE_SKILLS_METADATA_URL, CORE_SKILLS_URL } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialSkillFile, DialSkillResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApiConfig } from '@/src/server/base-api';
import { ResourceType } from '@/src/types/resource-type';
import { CoreResourceMetadataNode } from './asset-metadata';
import { ComplexResourceCoreApi } from './complex-resource-core-api';

/** Core's mandatory manifest filename — a skill has no meaning without it (see `SkillDetails.tsx`). */
const SKILL_MANIFEST_FILE = 'SKILL.md';

/** Builds a new skill's `SKILL.md` manifest content from its name and description. */
const buildSkillManifest = (name: string, description: string): string =>
  `---\nname: ${name}\ndescription: ${description}\n---\n`;

/**
 * Skills' `v2/skills` Core client. Every operation lives in {@link ComplexResourceCoreApi}; this class only
 * binds the Skills routes and keeps the Skill-named method surface its callers use.
 */
export class SkillsCoreApi extends ComplexResourceCoreApi {
  constructor(config: BaseApiConfig) {
    super(config, {
      type: ResourceType.SKILL,
      contentUrl: CORE_SKILLS_URL,
      metadataUrl: CORE_SKILLS_METADATA_URL,
      manifestFile: SKILL_MANIFEST_FILE,
    });
  }

  getSkillMetadata(token: Token, path: string): Promise<DialSkillResource | null> {
    return this.getResourceMetadata(token, path);
  }

  getSkillFiles(token: Token, path: string): Promise<DialSkillFile[]> {
    return this.getResourceFiles(token, path);
  }

  uploadSkillFile(
    token: Token,
    path: string,
    filePath: string,
    file: File,
    options: { overwrite?: boolean } = {},
  ): Promise<ServerActionResponse> {
    return this.uploadResourceFile(token, path, filePath, file, options);
  }

  createSkill(token: Token, path: string, name: string, description: string): Promise<ServerActionResponse> {
    return this.createResource(token, path, buildSkillManifest(name, description));
  }

  createSkillFolder(token: Token, path: string): Promise<ServerActionResponse> {
    return this.createResourceFolder(token, path);
  }

  getSkillManifestContent(token: Token, path: string): Promise<ServerActionResponse> {
    return this.getManifestContent(token, path);
  }

  downloadSkillFile(token: Token, path: string, filePath: string): Promise<Response> {
    return this.downloadResourceFile(token, path, filePath);
  }

  previewSkillFile(token: Token, path: string, filePath: string): Promise<Response> {
    return this.previewResourceFile(token, path, filePath);
  }

  deleteSkillFile(token: Token, path: string, filePath: string, etag?: string): Promise<ServerActionResponse> {
    return this.deleteResourceFile(token, path, filePath, etag);
  }

  listSkillMetadata(
    token: Token,
    path: string,
    options: { nextToken?: string; limit?: number } = {},
  ): Promise<CoreResourceMetadataNode | null> {
    return this.listResourceMetadata(token, path, options);
  }

  deleteSkill(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    return this.deleteResource(token, path, etag);
  }

  deleteSkillFolder(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    return this.deleteResourceFolder(token, path, etag);
  }
}
