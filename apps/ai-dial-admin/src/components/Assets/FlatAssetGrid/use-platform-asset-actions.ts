'use client';

import { DialFile } from '@epam/ai-dial-react-file-manager';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { getDeleteNotificationContent } from '@/src/components/Assets/utils';
import {
  BulkDeleteAssetActionMap,
  CreateAssetActionMap,
  PlatformBulkDeleteAssetActionMap,
  PlatformCreateAssetActionMap,
  PlatformGetAssetActionMap,
  GetAssetActionMap,
  getFlatDuplicateDestination,
  getPlatformAssetDuplicate,
} from '@/src/components/Assets/BaseAssetList/utils';
import { BaseAssetRoute, CreateAssetRoute } from '@/src/components/Assets/BaseAssetList/types';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { AssetTabsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialAppRunnerResource, PlatformAsset } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { hasFlatPublic, hasPublicTree } from '@/src/utils/files/asset-sources';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetSource } from '@/src/models/dial/asset-source';
import { FlatAssetSource } from './models';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

// The grid can unmount while a delete is in flight, so the guard must outlive it.
const pendingDeletes = new Set<string>();

export enum PlatformModalType {
  Duplicate = 'duplicate',
  Delete = 'delete',
}

interface Params {
  view: ApplicationRoute;
  /** The tab the rows come from: a duplicate of a flat Public row stays public. */
  source: FlatAssetSource;
  /** Re-reads the Platform rows after a write. */
  refetch: () => Promise<void>;
}

/** Duplicate and delete for the Platform tab. Platform rows have no folder, so none of this reads a folder context. */
export const usePlatformAssetActions = ({ view, source, refetch }: Params) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [modalType, setModalType] = useState<PlatformModalType | null>(null);
  const [duplicateItem, setDuplicateItem] = useState<AssetWithVersion | null>(null);
  const [deletedItems, setDeletedItems] = useState<AssetListItem[] | null>(null);
  // Applications and Toolsets keep a Public tree, so their platform writes use the bucket-specific actions.
  const isDualBucket = hasPublicTree(view);

  const onCloseModal = useCallback(() => {
    setModalType(null);
    setDuplicateItem(null);
    setDeletedItems(null);
  }, []);

  const onOpenDuplicate = useCallback(
    async (row?: AssetListItem) => {
      if (!row) {
        return;
      }

      const getAsset =
        (isDualBucket ? PlatformGetAssetActionMap[view] : undefined) ?? GetAssetActionMap[view as BaseAssetRoute];
      const full = await getAsset(row.path, DEFAULT_ETAG);
      setDuplicateItem(full?.response as AssetWithVersion);
      setModalType(PlatformModalType.Duplicate);
    },
    [isDualBucket, view],
  );

  const onDuplicate = useCallback(
    async (asset: AssetWithVersion) => {
      const original = asset as unknown as PlatformAsset;
      const duplicate = getPlatformAssetDuplicate(view, original);
      const destination = hasFlatPublic(view)
        ? `${source === AssetSource.Public ? ROOT_FOLDER : PLATFORM_ROOT_FOLDER}/`
        : getFlatDuplicateDestination(view, original, isDualBucket);
      const folderId = destination ?? 'platform/';
      const create =
        (isDualBucket ? PlatformCreateAssetActionMap[view] : undefined) ??
        CreateAssetActionMap[view as CreateAssetRoute];

      onCloseModal();
      const res = await create({ ...(duplicate as unknown as AssetWithVersion), folderId });
      if (!res.success) {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        return;
      }

      void refetch();
      const label = duplicate.name || (duplicate as DialAppRunnerResource).$id || '';
      showNotification(
        getSuccessNotification(getCreateNotificationTitle(view, t), getCreateNotificationDescription(view, label, t)),
      );
      router.push(getUrnForEntity(view, { ...duplicate, folderId }));
    },
    [isDualBucket, onCloseModal, refetch, router, showNotification, source, t, view],
  );

  const onOpenDelete = useCallback(
    (rows: AssetListItem[]) => {
      if (!rows.length || pendingDeletes.has(`${view}:${source}`)) {
        return;
      }

      setDeletedItems([...rows]);
      setModalType(PlatformModalType.Delete);
    },
    [source, view],
  );

  const onDelete = useCallback(async (): Promise<boolean> => {
    const rows = deletedItems;
    const deleteKey = `${view}:${source}`;
    if (!rows || pendingDeletes.has(deleteKey)) {
      return false;
    }

    pendingDeletes.add(deleteKey);
    const bulkDelete =
      (isDualBucket ? PlatformBulkDeleteAssetActionMap[view] : undefined) ??
      BulkDeleteAssetActionMap[view as BaseAssetRoute];
    onCloseModal();
    let isDeleted = false;
    try {
      try {
        const res = await bulkDelete(rows.map((row) => ({ path: row.path, etag: row.etag || DEFAULT_ETAG })));
        if (!res.success) {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        } else {
          isDeleted = true;
          const notifications = getDeleteNotificationContent(view, rows as unknown as DialFile[], t);
          const list = Array.isArray(notifications) ? notifications : [notifications];
          list.forEach(({ title, description }) => showNotification(getSuccessNotification(title, description)));
        }
      } catch (error) {
        showNotification(
          getErrorNotification(t(ErrorI18nKey.ServerError), error instanceof Error ? error.message : undefined),
        );
      }

      try {
        await refetch();
      } catch {
        showNotification(getErrorNotification(t(AssetTabsI18nKey.LoadError)));
        return false;
      }
      return isDeleted;
    } finally {
      pendingDeletes.delete(deleteKey);
    }
  }, [deletedItems, isDualBucket, onCloseModal, refetch, showNotification, source, t, view]);

  return { modalType, duplicateItem, deletedItems, onOpenDuplicate, onDuplicate, onOpenDelete, onDelete, onCloseModal };
};
