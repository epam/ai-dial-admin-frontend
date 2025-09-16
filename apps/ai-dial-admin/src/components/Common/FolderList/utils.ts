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
