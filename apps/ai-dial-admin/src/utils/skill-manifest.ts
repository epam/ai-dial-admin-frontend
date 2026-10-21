import { parseFrontmatter, stringifyFrontmatter } from '@/src/utils/frontmatter';

export interface SkillManifest {
  name: string;
  description: string;
  body: string;
}

/**
 * Parses `SKILL.md`'s YAML frontmatter (`name`/`description`) and its body content (the markdown
 * after the frontmatter block). The shared parser keeps this boundary aligned with Core's own
 * `SkillHandler.parseFrontmatter` regex/YAML expectations.
 */
export const parseSkillManifest = (content: string): SkillManifest => {
  const { attributes, body } = parseFrontmatter(content);
  return {
    name: typeof attributes.name === 'string' ? attributes.name : '',
    description: typeof attributes.description === 'string' ? attributes.description : '',
    body,
  };
};

/**
 * Reassembles a valid `SKILL.md` document from an edited `name`/`description`/`body`, preserving any
 * other frontmatter key already present in `originalContent` (e.g. `version`) untouched — this app
 * never edits `version`, so a save must not silently drop it. Re-parses `originalContent` rather than
 * requiring the caller to carry its frontmatter forward, so callers only ever handle the three fields
 * they actually edit.
 */
export const buildSkillManifest = (originalContent: string, manifest: SkillManifest): string => {
  const { attributes } = parseFrontmatter(originalContent);

  return stringifyFrontmatter({ ...attributes, name: manifest.name, description: manifest.description }, manifest.body);
};
