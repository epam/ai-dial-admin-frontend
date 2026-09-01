import JSZip from 'jszip';

import { Token } from '@/src/models/auth';
import { getFolderNameAndPath, getPathFromUrl } from '@/src/utils/files/path';
import { FilesCoreApi } from '@/src/server/core/files-core-api';
import { gatherResourceUrls, isFolderNode, isTechnicalItem, WalkableNode } from '@/src/server/folders/resource-walk';

/**
 * Ports the admin backend's `FileService.export` path-resolution and archive-path rewriting
 * (`ExportPathUtils`/`ResourceEximExportHelper`) — this is not a plain "zip the selected
 * files" operation; see `migrate-files-export-to-core`'s design.
 */

export interface ExportEntry {
  storagePath: string;
  /** `null` for a directly-selected file; the selected folder's path when picked up via expansion. */
  exportFolderPath: string | null;
}

/**
 * Resolves user-selected paths into a flat list of exportable entries: folders expand
 * recursively to every descendant file at any nesting depth, technical marker resources are
 * excluded, and a duplicate storage path across entries is rejected rather than silently
 * colliding.
 *
 * Folder-vs-file is decided from the path's own `nodeType` in DIAL Core — never from whether
 * the path string happens to end in `/` — so a folder selection can't be silently misclassified
 * as a single file and resolve to zero exportable entries.
 */
export const resolveExportEntries = async (
  paths: string[],
  getNode: (path: string) => Promise<WalkableNode | null>,
  gatherDescendantUrls: (path: string) => Promise<string[]>,
): Promise<ExportEntry[]> => {
  const entries: ExportEntry[] = [];
  const seen = new Set<string>();

  const addEntry = (storagePath: string, exportFolderPath: string | null) => {
    if (isTechnicalItem(storagePath)) {
      return;
    }
    if (seen.has(storagePath)) {
      throw new Error(`Duplicate entry for path: ${storagePath}`);
    }
    seen.add(storagePath);
    entries.push({ storagePath, exportFolderPath });
  };

  for (const path of paths) {
    const node = await getNode(path);
    if (node && isFolderNode(node)) {
      const urls = await gatherDescendantUrls(path);
      urls.forEach((url) => addEntry(getPathFromUrl(url), path));
    } else {
      addEntry(path, null);
    }
  }

  return entries;
};

/**
 * A single selected file flattens to `<filename>`; a folder selection's children are re-rooted to
 * `<lastFolderSegment>/<path-relative-to-that-folder>`. The archive path is bucket-agnostic — the
 * destination folder chosen at import time determines the final storage location.
 */
export const toExportArchivePath = (storagePath: string, exportFolderPath: string | null): string => {
  if (exportFolderPath === null) {
    return getFolderNameAndPath(storagePath).name;
  }

  const normalizedFolder = exportFolderPath.endsWith('/') ? exportFolderPath : `${exportFolderPath}/`;
  const lastSegment = getFolderNameAndPath(normalizedFolder).name;
  const relativePath = storagePath.startsWith(normalizedFolder)
    ? storagePath.slice(normalizedFolder.length)
    : storagePath;

  return `${lastSegment}/${relativePath}`;
};

const generateExportFileName = (paths: string[]): string => {
  if (paths.length === 1) {
    return `${getFolderNameAndPath(paths[0]).name}.zip`;
  }
  return `files-export-${paths.length}.zip`;
};

/** Builds the export archive directly against Core: resolve entries, download each, zip them up. */
export const buildFilesExportZip = async (
  filesCoreApi: FilesCoreApi,
  token: Token,
  paths: string[],
): Promise<{ blob: Blob; fileName: string }> => {
  const getNode = (path: string) => filesCoreApi.getFileMetadata(token, path, false);
  const gatherDescendantUrls = (path: string) =>
    gatherResourceUrls(
      (folderPath, nextToken) => filesCoreApi.getFileMetadata(token, folderPath, true, nextToken),
      path,
    );

  const entries = await resolveExportEntries(paths, getNode, gatherDescendantUrls);
  const zip = new JSZip();
  for (const entry of entries) {
    const fileName = getFolderNameAndPath(entry.storagePath).name;
    const response = await filesCoreApi.downloadFile(token, entry.storagePath, fileName);
    const buffer = await response.arrayBuffer();
    const archivePath = toExportArchivePath(entry.storagePath, entry.exportFolderPath);
    zip.file(`files/${archivePath}`, buffer);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, fileName: generateExportFileName(paths) };
};
