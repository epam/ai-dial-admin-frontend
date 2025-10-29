import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * Generate row data for prompts delete modal grid
 *
 * @param {DialPrompt[]} prompts - prompts to show
 * @returns {DialPrompt[]} - modified prompts with all versions for one prompt
 */
export const generatePromptRowDataForDelete = (prompts: DialPrompt[]): DialPrompt[] => {
  const promptMap = prompts?.reduce((map, prompt) => {
    const existingPrompt = map.get(prompt.name as string);
    if (existingPrompt) {
      existingPrompt.versions?.push(prompt.version);
    } else {
      map.set(prompt.name as string, {
        ...prompt,
        version: prompt.version,
        versions: [prompt.version],
      });
    }

    return map;
  }, new Map<string, DialPrompt>());

  return promptMap ? Array.from(promptMap.values()) : [];
};

/**
 * Generate folder list for bulk selection
 *
 * @param {string[]} paths - all paths
 * @returns {DialFile[]} - folder list
 */
export const generateFolderListFromBulkPaths = (paths: string[]): DialFile[] => {
  const root: DialFile[] = [];

  paths.forEach((path) => {
    const parts = path.split('/').filter(Boolean);
    let currentNode = root;

    parts.forEach((part, index) => {
      let existingNode = currentNode.find((node) => node.name === part);

      if (!existingNode) {
        const newNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/') + '/',
          nodeType: DialFileNodeType.FOLDER,
          children: [],
        } as unknown as DialFile;

        currentNode.push(newNode);
        existingNode = newNode;
      }
      if (existingNode.items) {
        currentNode = existingNode.items;
      }
    });
  });

  return root;
};

/**
 * Get resource type base on route
 *
 * @param {?ApplicationRoute} [route] - application route
 * @returns {ResourceType} - resource type
 */
export const getResourceTypeByView = (route?: ApplicationRoute): ResourceType => {
  if (route === ApplicationRoute.Prompts) {
    return ResourceType.PROMPT;
  }
  if (route === ApplicationRoute.Files) {
    return ResourceType.FILE;
  }
  if (route === ApplicationRoute.AssetsApplications) {
    return ResourceType.APPLICATION;
  }
  if (route === ApplicationRoute.AssetsToolsets) {
    return ResourceType.TOOLSET;
  }
  return '' as ResourceType;
};
