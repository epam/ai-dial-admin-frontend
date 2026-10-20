import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialGhostButton, DialLoader, DialSelect, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import { getToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import AddVersionModal from '@/src/components/Assets/Modals/AddVersionModal';
import { getVersionsPerName } from '@/src/components/Assets/utils';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ButtonsI18nKey, EntityFieldsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { modifyNameVersionInAsset } from '@/src/utils/entities/versions';

interface Props {
  view: ApplicationRoute;
  asset: AssetWithVersion;
  assets?: AssetWithVersion[] | null;
  onChangeAsset?: (asset: AssetWithVersion) => void;
  addedVersions: string[];
  onChangeAddedVersion?: (version: string[]) => void;
}

const AssetVersionControl: FC<Props> = ({
  view,
  asset,
  assets,
  onChangeAsset,
  addedVersions,
  onChangeAddedVersion,
}) => {
  const t = useI18n();

  const existingVersionsMap = useMemo(() => getVersionsPerName(assets || []), [assets]);
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());

  const [isVersionLoading, setIsVersionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();

  const versions = useMemo(() => {
    return assets?.map((asset) => asset.version) || [];
  }, [assets]);

  const items = useMemo(() => {
    return [...new Set([...versions, ...addedVersions])].map((v) => ({ value: v, label: v }));
  }, [addedVersions, versions]);

  const changeAssetForNewVersion = useCallback(
    (version: string, newAsset?: AssetWithVersion | null) => {
      if (newAsset) {
        const path = `${encodeURIComponent(newAsset.name as string)}?path=${encodeURIComponent(newAsset._metadata?.path || '')}`;
        router.push(`${view}/${path}`);
      } else {
        const path = modifyNameVersionInAsset(asset._metadata?.path || '', void 0, version);
        const newAsset = {
          ...asset,
          display_version: version,
          _metadata: {
            ...asset._metadata,
            version,
            path,
          },
        };
        onChangeAsset?.(newAsset as AssetWithVersion);
      }
    },
    [asset, onChangeAsset, router, view],
  );

  const onChangeVersion = useCallback(
    async (version: string) => {
      if (version === asset._metadata?.version) return;
      const getAsset = view === ApplicationRoute.AssetsApplications ? getApp : getToolset;
      setIsVersionLoading(true);
      getReqRef
        .current(getAsset, `${asset._metadata?.folderId}${asset._metadata?.name}__${version}`, DEFAULT_ETAG)
        .then((res) => {
          if (res.success) {
            const newVersionAsset = res.response as DeploymentAsset;
            changeAssetForNewVersion(version, newVersionAsset);
          } else {
            setIsVersionLoading(false);
            changeAssetForNewVersion(version);
          }
        });
    },
    [asset, view, changeAssetForNewVersion],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setIsModalOpen(true);
  }, []);

  const onAddVersion = useCallback(
    (version: string) => {
      onChangeAddedVersion?.([...new Set([...addedVersions, version])]);
      onChangeVersion(version);
      setIsModalOpen(false);
    },
    [addedVersions, onChangeVersion, onChangeAddedVersion],
  );

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <DialSelect
            prefix={`${t(EntityFieldsI18nKey.version)}: `}
            size={SelectSize.Sm}
            variant={SelectVariant.Secondary}
            options={items}
            value={asset._metadata?.version}
            disabled={isVersionLoading}
            onChange={(v) => onChangeVersion(v as string)}
            footer={
              <DialGhostButton
                className="w-full min-h-[34px] h-[34px]"
                iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                label={t(ButtonsI18nKey.Create)}
              />
            }
            onFooterClick={() => handleModalOpen(ModalType.addVersion)}
          />
          {isVersionLoading && <DialLoader fullWidth={false} size={16} />}
        </div>
      </div>
      {isModalOpen &&
        modalType === ModalType.addVersion &&
        createPortal(
          <AddVersionModal
            header={t(PromptsI18nKey.NewVersionCreate)}
            isModalOpen={isModalOpen}
            entityName={asset.name}
            existingVersions={{
              ...existingVersionsMap,
              ...(addedVersions
                ? { [asset.name as string]: [...(existingVersionsMap[asset.name as string] || []), ...addedVersions] }
                : {}),
            }}
            onClose={handleModalClose}
            onConfirm={onAddVersion}
          />,
          document.body,
        )}
    </>
  );
};

export default AssetVersionControl;
