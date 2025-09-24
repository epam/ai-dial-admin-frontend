import { DialPrompt } from '@/src/models/dial/prompt';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';

export const getIsNeedToMove = (entity: DialPrompt, initialEntity?: DialPrompt) => {
  return entity.folderId !== initialEntity?.folderId;
};

export const getEntityForUpdate = (entity: DialPrompt, initialEntity?: DialPrompt) => {
  return {
    ...entity,
    folderId: (initialEntity as DialPrompt)?.folderId,
  };
};

export const addNewVersion = (entity: DialPrompt, version: string) => {
  const path = modifyNameVersionInPrompt(entity.path, void 0, version);
  return {
    ...entity,
    path,
    version,
  };
};
