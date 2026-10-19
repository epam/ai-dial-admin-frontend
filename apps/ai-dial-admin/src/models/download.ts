export interface DownloadedFile {
  blob: Blob;
  fileName: string;
  // `X-Total-Count`: how many rows matched, where the service reports it — possibly more than the file holds.
  totalCount?: number;
}
