import { buildManifest, Manifest, parseManifest } from '@/src/utils/manifest';

export type SkillManifest = Manifest;

/** Parses `SKILL.md` — see {@link parseManifest}. */
export const parseSkillManifest = (content: string): SkillManifest => parseManifest(content);

/** Reassembles `SKILL.md` from edited fields, preserving untouched frontmatter keys — see {@link buildManifest}. */
export const buildSkillManifest = (originalContent: string, manifest: SkillManifest): string =>
  buildManifest(originalContent, manifest);
