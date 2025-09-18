import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';

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

export const generateFolderListFromBulkPaths = (paths: string[]) => {
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
          nodeType: 'folder',
          children: [],
        } as unknown as DialFile;

        currentNode.push(newNode);
        existingNode = newNode;
      }
      if (existingNode.children) {
        currentNode = existingNode.children;
      }
    });
  });

  return root;
};
