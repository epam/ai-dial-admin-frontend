import { PROJECT_CONTEXT_FOLDER, PROJECT_MANIFEST_FILE } from '@/src/constants/project';
import { parseFrontmatter, stringifyFrontmatter } from '@/src/utils/frontmatter';

export interface ProjectManifest {
  name: string;
  description: string;
  instructions: string;
}

/**
 * Builds `PROJECT.md` byte-compatibly with the chat application: `---`-fenced YAML frontmatter with `name` and
 * `description`, a blank line, then the instructions verbatim, with no trailing newline added. Frontmatter keys
 * other than `name`/`description` already present in `originalContent` (written by another client) are carried
 * through after the two. The frontmatter goes through the YAML serializer, never string concatenation, so a
 * description cannot inject keys or close the fence early.
 */
export const buildProjectManifest = (originalContent: string, manifest: ProjectManifest): string => {
  const { attributes } = parseFrontmatter(originalContent);
  const extras = Object.fromEntries(
    Object.entries(attributes).filter(([key]) => key !== 'name' && key !== 'description'),
  );

  // An empty body makes the serializer end the frontmatter with the blank line chat writes after the fence.
  return `${stringifyFrontmatter({ name: manifest.name, description: manifest.description, ...extras }, '')}${manifest.instructions}`;
};

/**
 * Inverse of {@link buildProjectManifest}: `description` from the frontmatter and the body, minus the single
 * blank line the builder writes after the fence, as `instructions`. Text with no valid frontmatter is kept whole
 * as the instructions. The frontmatter `name` is ignored — a project's name is its path.
 */
export const parseProjectManifest = (content: string): ProjectManifest => {
  const { attributes, body } = parseFrontmatter(content);
  const hasFrontmatter = body !== content;

  return {
    name: '',
    description: typeof attributes.description === 'string' ? attributes.description : '',
    instructions: hasFrontmatter ? body.replace(/^\r?\n/, '') : content,
  };
};

/** Core file path of a context file inside a project's bundle. */
export const toContextFilePath = (fileName: string): string => `${PROJECT_CONTEXT_FOLDER}/${fileName}`;

/** The context file name for a bundle path, or `undefined` for the manifest and anything outside `context/`. */
export const toContextFileName = (bundlePath: string): string | undefined => {
  if (bundlePath === PROJECT_MANIFEST_FILE) {
    return undefined;
  }
  const prefix = `${PROJECT_CONTEXT_FOLDER}/`;
  return bundlePath.startsWith(prefix) && bundlePath.length > prefix.length
    ? bundlePath.slice(prefix.length)
    : undefined;
};
