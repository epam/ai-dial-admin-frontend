'use client';

import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getImage, updateImage } from '@/src/app/actions/deployments';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import { IMAGE_IGNORED_FIELDS } from '@/src/constants/editor';
import { ImagesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';
import { validateImageChanged } from '@/src/utils/deployments/images';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getDeploymentsViewTabs } from '@/src/utils/tabs/utils';

import ImagesHeader from '@/src/components/EntityHeaderControls/ImagesHeader';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import TabsContent from './TabsContent';

interface Props {
  image: Image;
  containerNames?: string[];
  versions: ImageVersion[];
}

const ImageView: FC<Props> = ({ image, containerNames, versions }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { disableDeploymentsJSONEditor } = useAppContext();

  const [selectedImage, setSelectedImage] = useState<Image>(cloneDeep(image));
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [imageVersions, setImageVersions] = useState<ImageVersion[]>(versions);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      hideJsonEditorButton: disableDeploymentsJSONEditor,
    }),
    [disableDeploymentsJSONEditor, isEditorEnabled],
  );

  useEffect(() => {
    setImageVersions(versions);
  }, [versions]);

  const tabs = getDeploymentsViewTabs(
    ApplicationRoute.Images,
    t,
    selectedImage.buildStatus,
    selectedImage.allowedDomains,
  );

  useEffect(() => {
    setSelectedImage(cloneDeep(image));
  }, [image]);

  useEffect(() => {
    setIsChanged(validateImageChanged(image, selectedImage));
  }, [selectedImage, image]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedImage(cloneDeep(image));
  }, [isEditorEnabled, image]);

  const onSave = useCallback(() => {
    updateImage(selectedImage).then((res) => {
      if (res.success) {
        const type = getTranslatedType(getRouteByType(image.$type), t);
        showNotification(
          getSuccessNotification(
            t(ImagesI18nKey.ImagesUpdateSuccess, { type }),
            t(ImagesI18nKey.ImagesUpdateSuccessDescription, { type, name: image.name || '' }),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [image.$type, image.name, router, selectedImage, showNotification, t]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (selectedImage.buildStatus === IMAGE_STATUS.BUILDING) {
      interval = setInterval(async () => {
        const { response, success } = await getImage(selectedImage.id);
        if (success) {
          const updatedImage = response as Image;
          if (updatedImage) {
            router.refresh();
            if (updatedImage.buildStatus !== IMAGE_STATUS.BUILDING && interval) {
              clearInterval(interval);
            }
          }
        }
      }, IMAGE_BUILD_POLL_INTERVAL);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedImage, t, router]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <ImagesHeader
        tabs={tabs}
        originalImageName={image.name || ''}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        jsonConfiguration={jsonConfiguration}
        image={selectedImage}
        isChanged={isChanged}
        onSave={onSave}
        onDiscard={onDiscard}
        containerNames={containerNames}
        versions={imageVersions}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedImage}
            setSelectedEntity={setSelectedImage}
            setIsChanged={setIsChanged}
            ignoredFields={IMAGE_IGNORED_FIELDS}
          />
        ) : (
          <>
            <TabsContent
              activeTab={activeTab}
              imageVersions={imageVersions}
              onChange={setSelectedImage}
              selectedImage={selectedImage}
              onChangeVersions={setImageVersions}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ImageView;
