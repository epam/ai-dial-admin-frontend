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
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialAppRunnerResource, PlatformAsset } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { hasPublicSource } from '@/src/utils/files/asset-sources';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

export enum PlatformModalType {
  Duplicate = 'duplicate',
  Delete = 'delete',
}

interface Params {
  view: ApplicationRoute;
  /** Re-reads the Platform rows after a write. */
  refetch: () => Promise<void>;
}

/** Duplicate and delete for the Platform tab. Platform rows have no folder, so none of this reads a folder context. */
export const usePlatformAssetActions = ({ view, refetch }: Params) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [modalType, setModalType] = useState<PlatformModalType | null>(null);
  const [duplicateItem, setDuplicateItem] = useState<AssetWithVersion | null>(null);
  const [deletedItems, setDeletedItems] = useState<AssetListItem[] | null>(null);
  // Applications and Toolsets keep a Public tree, so their platform writes use the bucket-specific actions.
  const isDualBucket = hasPublicSource(view);

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
      const source = asset as unknown as PlatformAsset;
      const duplicate = getPlatformAssetDuplicate(view, source);
      const destination = getFlatDuplicateDestination(view, source, isDualBucket);
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
    [isDualBucket, onCloseModal, refetch, router, showNotification, t, view],
  );

  const onOpenDelete = useCallback((rows: AssetListItem[]) => {
    if (!rows.length) {
      return;
    }

    setDeletedItems(rows);
    setModalType(PlatformModalType.Delete);
  }, []);

  const onDelete = useCallback(async () => {
    const rows = deletedItems;
    if (!rows) {
      return;
    }

    const bulkDelete =
      (isDualBucket ? PlatformBulkDeleteAssetActionMap[view] : undefined) ??
      BulkDeleteAssetActionMap[view as BaseAssetRoute];
    onCloseModal();
    const res = await bulkDelete(rows.map((row) => ({ path: row.path, etag: row.etag || DEFAULT_ETAG })));
    if (!res.success) {
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      return;
    }

    void refetch();
    const notifications = getDeleteNotificationContent(view, rows as unknown as DialFile[], t);
    const list = Array.isArray(notifications) ? notifications : [notifications];
    list.forEach(({ title, description }) => showNotification(getSuccessNotification(title, description)));
  }, [deletedItems, isDualBucket, onCloseModal, refetch, showNotification, t, view]);

  return { modalType, duplicateItem, deletedItems, onOpenDuplicate, onDuplicate, onOpenDelete, onDelete, onCloseModal };
};
