import { ApiRoute } from '@/src/constants/api-routes';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';

export async function importPrompts(body: FormData, fileType: ImportFileType): Promise<ServerActionResponse> {
  const url = `${ApiRoute.PromptsImport}?fileType=${encodeURIComponent(fileType)}`;
  const res = await fetch(url, {
    method: 'POST',
    body,
    credentials: 'include',
  });
  const data = await res.json();
  return data as ServerActionResponse;
}
