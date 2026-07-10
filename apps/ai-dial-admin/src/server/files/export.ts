import JSZip from 'jszip';

import { Token } from '@/src/models/auth';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { FilesCoreApi } from '@/src/server/core/files-core-api';

/**
 * Ports the admin backend's `FileService.export` path-resolution and archive-path rewriting
 * (`ExportPathUtils`/`ResourceEximExportHelper`) — this is not a plain "zip the selected
 * files" operation; see `migrate-files-export-to-core`'s design.
 */

const DIAL_FOLDER_MARKER = '.dial_folder';

/** A folder-marker resource (`.dial_folder` or `.dial_folder__<version>`), excluded from export. */
export const isTechnicalItem = (path: string): boolean => {
  const { name } = getFolderNameAndPath(path);
  return name === DIAL_FOLDER_MARKER || name.startsWith(`${DIAL_FOLDER_MARKER}__`);
};

const isFolderPath = (path: string): boolean => path.endsWith('/');

export interface ExportEntry {
  storagePath: string;
  /** `null` for a directly-selected file; the selected folder's path when picked up via expansion. */
  exportFolderPath: string | null;
}

/**
 * Resolves user-selected paths into a flat list of exportable entries: folders expand to
 * their direct children only (one level deep — matching the backend's own behavior exactly,
 * not a design goal of this port), technical marker resources are excluded, and a duplicate
 * storage path across entries is rejected rather than silently colliding.
 */
export const resolveExportEntries = async (
  paths: string[],
  listFolderChildren: (folderPath: string) => Promise<string[]>,
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
    if (isFolderPath(path)) {
      const children = await listFolderChildren(path);
      children.forEach((child) => addEntry(child, path));
    } else {
      addEntry(path, null);
    }
  }

  return entries;
};

/**
 * A single selected file flattens to `public/<filename>`; a folder selection's children are
 * re-rooted to `public/<lastFolderSegment>/<path-relative-to-that-folder>`.
 */
export const toExportArchivePath = (storagePath: string, exportFolderPath: string | null): string => {
  if (exportFolderPath === null) {
    return `public/${getFolderNameAndPath(storagePath).name}`;
  }

  const normalizedFolder = exportFolderPath.endsWith('/') ? exportFolderPath : `${exportFolderPath}/`;
  const lastSegment = getFolderNameAndPath(normalizedFolder).name;
  const relativePath = storagePath.startsWith(normalizedFolder)
    ? storagePath.slice(normalizedFolder.length)
    : storagePath;

  return `public/${lastSegment}/${relativePath}`;
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
  const listFolderChildren = async (folderPath: string): Promise<string[]> => {
    const node = await filesCoreApi.getFileMetadata(token, folderPath, false);
    return (node?.items || [])
      .filter((item) => String(item.nodeType).toUpperCase() === 'ITEM')
      .map((item) => item.path)
      .filter((path): path is string => Boolean(path));
  };

  const entries = await resolveExportEntries(paths, listFolderChildren);

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
