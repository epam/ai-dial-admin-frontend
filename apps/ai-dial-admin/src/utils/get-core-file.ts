import { ConflictResolutionPolicy } from '@/src/types/import';

export const getCoreFileFormat = (file: Record<string, unknown>, resolutionPolicy: ConflictResolutionPolicy) => {
  const body = new FormData();

  const jsonString = JSON.stringify(file);

  const blob = new Blob([jsonString], { type: 'application/json' });
  body.append('file', blob);
  body.append('resolutionPolicy', resolutionPolicy.toUpperCase());
  return body;
};
