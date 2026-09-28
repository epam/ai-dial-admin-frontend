import { CustomFile, DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';

export interface EntityFileActions {
  getFiles: (id: string) => Promise<CustomFile[] | null>;
  uploadFiles: (id: string, file: FormData) => Promise<ServerActionResponse<DialFile[]>>;
  removeFile: (id: string, fileName: string) => Promise<ServerActionResponse>;
}
