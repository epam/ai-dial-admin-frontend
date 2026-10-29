import { parseFrontmatter, stringifyFrontmatter } from '@/src/utils/frontmatter';

export interface Manifest {
  name: string;
  description: string;
  body: string;
}

/**
 * Parses a complex resource's manifest (`SKILL.md`, `PROJECT.md`): YAML frontmatter `name`/`description` and
 * the markdown body after the frontmatter block. Text with no valid frontmatter parses to an empty
 * description with the whole text as the body. The shared parser keeps this boundary aligned with Core's own
 * frontmatter regex/YAML expectations.
 */
export const parseManifest = (content: string): Manifest => {
  const { attributes, body } = parseFrontmatter(content);
  return {
    name: typeof attributes.name === 'string' ? attributes.name : '',
    description: typeof attributes.description === 'string' ? attributes.description : '',
    body,
  };
};

/**
 * Reassembles a valid manifest document from an edited `name`/`description`/`body`, preserving any other
 * frontmatter key already present in `originalContent` (e.g. `version`) untouched — this app never edits
 * those, so a save must not silently drop them. Re-parses `originalContent` rather than requiring the caller
 * to carry its frontmatter forward, so callers only ever handle the three fields they actually edit.
 */
export const buildManifest = (originalContent: string, manifest: Manifest): string => {
  const { attributes } = parseFrontmatter(originalContent);

  return stringifyFrontmatter({ ...attributes, name: manifest.name, description: manifest.description }, manifest.body);
};
