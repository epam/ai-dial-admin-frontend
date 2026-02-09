'use client';

import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cloneDeep } from 'lodash';

import { Image, ImageVersion } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { ImagesI18nKey } from '@/src/constants/i18n';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { Container } from '@/src/models/deployments/containers';
import { EntityViewTab, getDeploymentsViewTabs } from '@/src/utils/tabs/utils';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useAppContext } from '@/src/context/AppContext';
import { validateImageChanged } from '@/src/utils/deployments/images';
import { getImage, updateImage } from '@/src/app/actions/deployments';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';

import HeaderButtons from '@/src/components/Images/View/HeaderButtons';
import Properties from '@/src/components/Images/View/Properties/Properties';
import Containers from '@/src/components/Images/View/Containers/Containers';
import InstallationLog from '@/src/components/Images/View/InstallationLog/InstallationLog';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import FirewallSettings from '@/src/components/Images/View/FirewallSettings/FirewallSettings';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';

interface Props {
  image: Image;
  route: ApplicationRoute;
  imagesNames: string[];
  containerNames?: string[];
  versions: ImageVersion[];
  dependencies: Container[];
}

const ImageView: FC<Props> = ({ image, route, imagesNames, containerNames, versions, dependencies }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { disableDeploymentsJSONEditor } = useAppContext();
  const { dispatch } = useSaveValidationContext();

  const [selectedImage, setSelectedImage] = useState<Image>(cloneDeep(image));
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [imageVersions, setImageVersions] = useState<ImageVersion[]>(versions);

  useEffect(() => {
    setImageVersions(versions);
  }, [versions]);

  const tabs = getDeploymentsViewTabs(route, t, selectedImage.buildStatus);

  useEffect(() => {
    setSelectedImage(cloneDeep(image));
  }, [image]);

  useEffect(() => {
    setIsChanged(validateImageChanged(image, selectedImage));
  }, [selectedImage, image]);

  const toggleJsonEditor = useCallback(() => {
    setIsEditorEnabled((prev) => !prev);
  }, [setIsEditorEnabled]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    dispatch({ type: ValidationActionType.Reset });
    setSelectedImage(cloneDeep(image));
  }, [isEditorEnabled, image, dispatch]);

  const onSave = useCallback(() => {
    updateImage(selectedImage).then((res) => {
      if (res.success) {
        const type = getTranslatedType(getRouteByType(image.$type), t);
        showNotification(
          getSuccessNotification(
            t(ImagesI18nKey.ImagesUpdateSuccess, { type }),
            t(ImagesI18nKey.ImagesUpdateSuccessDescription, { type, name: image.name }),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [image.$type, image.name, router, selectedImage, showNotification, t]);

  const onChangeImage = useCallback(
    (image: Image) => {
      setSelectedImage(image);
    },
    [setSelectedImage],
  );

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
  }, [selectedImage, route, t, router]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <div className={getViewHeaderClassName(isEditorEnabled)}>
          <Tabs tabs={tabs} isEditorEnabled={isEditorEnabled} activeTab={activeTab} onChangeActiveTab={setActiveTab} />

          <HeaderButtons
            route={route}
            image={selectedImage}
            originalImageName={image.name}
            isChanged={isChanged}
            onSave={onSave}
            onDiscard={onDiscard}
            jsonEditorEnabled={isEditorEnabled}
            toggleJsonEditor={toggleJsonEditor}
            hideJsonEditor={disableDeploymentsJSONEditor}
            imagesNames={imagesNames}
            containerNames={containerNames}
            versions={imageVersions}
            dependencies={dependencies}
          />
        </div>
        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {isEditorEnabled ? (
            <>
              <EntityJsonEditor
                key={key}
                entity={selectedImage as BaseEntity}
                setSelectedEntity={setSelectedImage as Dispatch<SetStateAction<BaseEntity>>}
                setIsChanged={setIsChanged}
              />
            </>
          ) : (
            <>
              {activeTab === EntityViewTab.Properties && (
                <Properties
                  image={selectedImage}
                  setImage={onChangeImage}
                  originalName={image.name}
                  setImageVersions={setImageVersions}
                />
              )}
              {activeTab === EntityViewTab.RelatedContainers && (
                <Containers image={selectedImage} route={route} versions={imageVersions} />
              )}
              {activeTab === EntityViewTab.InstallationLog && <InstallationLog imageBuildId={selectedImage.id} />}
              {activeTab === EntityViewTab.Firewall && (
                <FirewallSettings image={selectedImage} setImage={setSelectedImage} route={route} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageView;
