import { useCallback, useEffect, useRef } from 'react';

import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';

export const useFileManagerExpansion = ({
  expandedFolders,
  setExpandedFolders,
  fetchedFoldersData,
  fetchFiles,
  isFetchingFiles,
}: AssetsFolderContextReader) => {
  const expandedFoldersRef = useRef(expandedFolders);
  const pendingPathsRef = useRef(new Set<string>());
  const wasFetchingRef = useRef(isFetchingFiles);
  expandedFoldersRef.current = expandedFolders;

  useEffect(() => {
    pendingPathsRef.current.forEach((path) => {
      if (fetchedFoldersData?.[path] != null) {
        pendingPathsRef.current.delete(path);
      }
    });

    // An idle render before the request starts must not release freshly registered paths.
    if (wasFetchingRef.current && !isFetchingFiles) {
      pendingPathsRef.current.clear();
    }
    wasFetchingRef.current = isFetchingFiles;
  }, [fetchedFoldersData, isFetchingFiles]);

  const onFetchFolder = useCallback(
    (path: string) => {
      if (fetchedFoldersData?.[path] != null || pendingPathsRef.current.has(path)) {
        return;
      }

      pendingPathsRef.current.add(path);
      fetchFiles(path);
    },
    [fetchFiles, fetchedFoldersData],
  );

  const onExpandedPathsChange = useCallback(
    (paths: Set<string>) => {
      const previousPaths = expandedFoldersRef.current;
      expandedFoldersRef.current = paths;
      setExpandedFolders(paths);

      paths.forEach((path) => {
        if (!previousPaths?.has(path)) {
          onFetchFolder(path);
        }
      });
    },
    [onFetchFolder, setExpandedFolders],
  );

  return { onExpandedPathsChange, onFetchFolder };
};
