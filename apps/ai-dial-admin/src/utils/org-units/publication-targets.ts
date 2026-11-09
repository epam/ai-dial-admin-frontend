import { Publication, PublicationEntity } from '@/src/models/dial/publications';

type PublicationEntities = Partial<
  Record<
    | 'files'
    | 'prompts'
    | 'toolSetResources'
    | 'applicationResources'
    | 'conversations'
    | 'skillResources'
    | 'projectResources',
    PublicationEntity[]
  >
>;

const ENTITY_KEYS: (keyof PublicationEntities)[] = [
  'files',
  'prompts',
  'toolSetResources',
  'applicationResources',
  'conversations',
  'skillResources',
  'projectResources',
];

/** `applications/public/Acme/app/1.0` → `public/Acme/app/1.0`: Core prefixes a target URL with its type. */
const stripTypeSegment = (url: string): string => url.split('/').slice(1).join('/');

/** Every path a publication writes to: its target folder and the target of each resource it carries. */
export const getPublicationTargetPaths = (publication: Publication & PublicationEntities): string[] => {
  const resourceTargets = ENTITY_KEYS.flatMap((key) => publication[key] ?? []).map((entity) =>
    stripTypeSegment(entity.targetUrl),
  );

  return [publication.folderId, ...resourceTargets].filter(Boolean);
};
