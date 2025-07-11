import { DialPrompt } from '@/src/models/dial/prompt';

export const getIsNeedToMove = (entity: DialPrompt, initialEntity?: DialPrompt) => {
  return entity.folderId !== initialEntity?.folderId;
};

export const getEntityForUpdate = (entity: DialPrompt, initialEntity?: DialPrompt) => {
  return {
    ...entity,
    folderId: (initialEntity as DialPrompt)?.folderId,
  };
};
