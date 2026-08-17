import { CORE_SKILLS_METADATA_URL } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialSkillResource } from '@/src/models/dial/resource';
import { encodeCorePath } from '@/src/server/publications/path';
import { CoreApi } from './core-api';

interface CoreSkillMetadataItem {
  name: string;
  contentLength?: number;
}

/**
 * Shape of Core's folder-metadata response for a skill (`GET /v2/metadata/skills/{bucket}/{path}/`).
 * Isolated here deliberately — the `add-skill-publications` design doc flags this shape as unverified
 * against a running Core instance; if it differs, only this file and its mapping need correcting.
 */
interface CoreSkillMetadata {
  name?: string;
  etag?: string;
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
  };
  items?: CoreSkillMetadataItem[];
}

export class SkillsCoreApi extends CoreApi {
  /**
   * Reads a skill's folder metadata — name/description/version plus its contained files' name and
   * size — without fetching the skill's content (no ZIP, no `SKILL.md` body).
   */
  async getSkillMetadata(token: Token, path: string): Promise<DialSkillResource | null> {
    const url = `${CORE_SKILLS_METADATA_URL}/${encodeCorePath(path)}/`;
    const res = await this.get<CoreSkillMetadata>(url, token);
    if (!res) {
      return null;
    }

    return {
      name: res.metadata?.name ?? res.name ?? '',
      description: res.metadata?.description,
      version: res.metadata?.version,
      path,
      etag: res.etag,
      files: (res.items ?? []).map((item) => ({ name: item.name, size: item.contentLength ?? 0 })),
    };
  }
}
