import { COPY_LINK_ID_SUFFIX } from '../constants';

export const getCopyLinkId = (linkId: string, existingLinkIds: string[]): string => {
  const taken = new Set(existingLinkIds);
  let candidate = `${linkId}${COPY_LINK_ID_SUFFIX}`;
  for (let copyNumber = 2; taken.has(candidate); copyNumber++) {
    candidate = `${linkId}${COPY_LINK_ID_SUFFIX}${copyNumber}`;
  }
  return candidate;
};
