import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonVariant, DialButton, DialSelect, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconReplace } from '@tabler/icons-react';

import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import { getToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import { getPrompt } from '@/src/app/[lang]/prompts/actions';
import AddVersionModal from '@/src/components/Assets/Modals/AddVersionModal';
import CompareVersions from '@/src/components/Assets/Modals/CompareVersions';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { ButtonsI18nKey, CompareI18nKey, EntityFieldsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { Asset, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { isDeploymentAsset } from '@/src/utils/is-asset-view';
import { getErrorNotification } from '@/src/utils/notification';
import { modifyNameVersionInPrompt } from '@/src/utils/prompts/versions';

interface Props {
  view: ApplicationRoute;
  etag?: string;
  asset: Asset;
  assets?: Asset[];
  onChangeAsset?: (key: Asset) => void;
  addedVersions: string[];
  setAddedVersions?: Dispatch<SetStateAction<string[]>>;
}

const AssetVersionControl: FC<Props> = ({
  view,
  etag,
  asset,
  assets,
  onChangeAsset,
  addedVersions,
  setAddedVersions,
}) => {
  const t = useI18n() as (t: string) => string;

  const router = useRouter();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();

  const isDeployment = useMemo(() => {
    return isDeploymentAsset(view);
  }, [view]);

  const versions = useMemo(() => {
    return assets?.map((asset) => asset.version) || [];
  }, [assets]);

  const items = useMemo(() => {
    return [...new Set([...versions, ...addedVersions])].map((v) => ({ value: v, label: v }));
  }, [addedVersions, versions]);

  const changeAssetForNewVersion = useCallback(
    (version: string, newAsset?: Asset | null) => {
      if (newAsset) {
        onChangeAsset?.({} as DeploymentAsset);
        const path = `${encodeURIComponent(newAsset.name as string)}?path=${encodeURIComponent(newAsset.path)}`;
        router.push(`${view}/${path}`);
      } else {
        const path = modifyNameVersionInPrompt(asset.path, void 0, version);
        onChangeAsset?.({
          ...asset,
          version,
          path,
        });
      }
    },
    [asset, onChangeAsset, router, view],
  );

  const onChangeVersion = useCallback(
    async (version: string) => {
      if (version === asset.version) return;
      if (isDeployment) {
        const getAsset = view === ApplicationRoute.AssetsApplications ? getApp : getToolset;
        getReqRef.current(getAsset, asset.folderId, asset.name as string, version, etag).then((res) => {
          if (res.success) {
            const newVersionAsset = res.response as DeploymentAsset;
            changeAssetForNewVersion(version, newVersionAsset);
          } else {
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
          }
        });
      } else {
        const newVersionAsset = await getPrompt?.(asset.folderId, asset.name as string, version);
        changeAssetForNewVersion(version, newVersionAsset);
      }
    },
    [asset, isDeployment, view, etag, changeAssetForNewVersion, showNotification],
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
      setAddedVersions?.((prev) => [...new Set([...prev, version])]);
      onChangeVersion(version);
      setIsModalOpen(false);
    },
    [onChangeVersion, setAddedVersions],
  );

  return (
    <>
      <div className="flex items-center gap-4">
        <DialSelect
          prefix={`${t(EntityFieldsI18nKey.version)}: `}
          size={SelectSize.Sm}
          variant={SelectVariant.Secondary}
          options={items}
          value={asset.version}
          onChange={(v) => onChangeVersion(v as string)}
          footer={
            !isDeployment && (
              <DialButton
                cssClass="w-full min-h-[34px] h-[34px]"
                variant={ButtonVariant.Tertiary}
                iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                title={t(ButtonsI18nKey.Create)}
              />
            )
          }
          onFooterClick={() => handleModalOpen(ModalType.addVersion)}
        />

        {!isDeployment && !!assets?.length && assets.length > 1 && (
          <DialButton
            variant={ButtonVariant.Secondary}
            iconBefore={<IconReplace {...BASE_ICON_PROPS} />}
            title={t(CompareI18nKey.CompareVersions)}
            onClick={() => handleModalOpen(ModalType.compareVersions)}
          />
        )}
      </div>
      {isModalOpen &&
        modalType === ModalType.addVersion &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionCreate)}
            isModalOpen={isModalOpen}
            existingVersions={[...versions, ...addedVersions]}
            onClose={handleModalClose}
            onConfirm={onAddVersion}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.compareVersions &&
        createPortal(
          <CompareVersions
            heading={t(CompareI18nKey.CompareVersions)}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            prompts={assets as DialPrompt[]}
            prompt={asset as DialPrompt}
          />,
          document.body,
        )}
    </>
  );
};

export default AssetVersionControl;
