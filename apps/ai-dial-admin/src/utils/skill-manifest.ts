import matter from 'gray-matter';

export interface SkillManifest {
  name: string;
  description: string;
  body: string;
}

/**
 * Parses `SKILL.md`'s YAML frontmatter (`name`/`description`) and its body content (the markdown
 * after the frontmatter block). Built on `gray-matter`, already used elsewhere in the app (`MdViewer`)
 * to strip frontmatter — reused here instead of hand-rolling a YAML parser, so the parse boundary
 * matches Core's own `SkillHandler.parseFrontmatter` regex/YAML expectations.
 */
export const parseSkillManifest = (content: string): SkillManifest => {
  const { data, content: body } = matter(content);
  return {
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : '',
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
  const { data } = matter(originalContent);
  return matter.stringify(manifest.body, { ...data, name: manifest.name, description: manifest.description });
};
