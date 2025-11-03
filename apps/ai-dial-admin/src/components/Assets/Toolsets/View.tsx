'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ButtonVariant, DialButton, DialTabs } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { IconLogin, IconLogout } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import {
  getToolsets,
  moveToolsets,
  removeToolset,
  signInToolset,
  signOutToolset,
  updateToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import { addNewVersion, getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import ViewContent from '@/src/components/EntityView/View/Content/ViewContent';
import { EntityViewTab, propertiesTabs, toolsTabs } from '@/src/components/EntityView/View/utils';
import ToolsView from '@/src/components/Toolsets/Tools/Tools';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { Toolset, ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { addTrailingSlash, changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { encodeToolsetRedirectState, isLoggedInToToolset } from '@/src/utils/toolset/toolset-auth';
import LoginPopup from './LoginPopup';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  etag: string;
  oAuthCode?: string | null;
  originalToolset: AssetToolset;
  toolsets: AssetToolset[];
}

const ToolsetView: FC<Props> = ({ oAuthCode, etag, originalToolset, toolsets }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = [propertiesTabs(t), toolsTabs(t)];
  const router = useRouter();
  const { fetchFiles } = useToolsetFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState(false);

  const isToolsetSignedIn = useMemo(() => {
    return isLoggedInToToolset(selectedToolset);
  }, [selectedToolset]);

  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    if (Object.keys(selectedToolset).length && originalToolset) {
      setIsChanged(!isEqualSkippingUndefined(originalToolset, selectedToolset));
    }
  }, [selectedToolset, originalToolset]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedToolset(cloneDeep(originalToolset));
  }, [jsonEditorEnabled, originalToolset, dispatch]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedToolset, originalToolset);
      let updatedEntity = getEntityForUpdate(selectedToolset, originalToolset);
      if (newVersion) {
        updatedEntity = addNewVersion(updatedEntity, newVersion);
      }
      updateToolset(updatedEntity, etag).then((res) => {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.AssetsToolsets, t),
            getUpdateNotificationDescription(ApplicationRoute.AssetsToolsets, updatedEntity.name, t),
          ),
        );
        if (res.success) {
          if (isNeedToMove) {
            getToolsets(addTrailingSlash(updatedEntity.folderId)).then((toolsets) => {
              const pathsToMove = getListOfPathsToMove(updatedEntity, null, toolsets || []);
              const newPath = removeTrailingSlash(selectedToolset.folderId);
              moveToolsets(pathsToMove, newPath).then((r) => {
                if (r.every((response) => response.success)) {
                  router.push(
                    getUrnForEntity(ApplicationRoute.AssetsToolsets, {
                      name: updatedEntity.name,
                      path: changePath(updatedEntity.path, newPath),
                    }),
                  );
                  fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
                }
              });
            });
          } else {
            fetchFiles(updatedEntity.folderId);
            router.push(getUrnForEntity(ApplicationRoute.AssetsToolsets, updatedEntity));
          }
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [selectedToolset, originalToolset, etag, showNotification, t, router, fetchFiles],
  );

  const onChangeEntity = useCallback(
    (entity: Toolset) => {
      setSelectedToolset(entity as AssetToolset);
    },
    [setSelectedToolset],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onRemove = useCallback(
    (entity: string) => {
      return removeToolset(entity, etag);
    },
    [etag],
  );

  const signIn = useCallback(
    (type: ToolsetAuthCredentialLevel, code?: string) => {
      signInToolset(selectedToolset, type, code).then((res) => {
        if (res.success) {
          router.push(getUrnForEntity(ApplicationRoute.AssetsToolsets, selectedToolset));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, selectedToolset, showNotification],
  );

  const onLogin = useCallback(
    (type: ToolsetAuthCredentialLevel) => {
      const authSettings = selectedToolset.authSettings;
      if (authSettings && authSettings?.authenticationType === ToolsetAuthType.OAUTH) {
        const callbackUrl = `${window.location.pathname}${window.location.search}`;
        const state = {
          callbackUrl,
          toolsetId: selectedToolset.name,
          credentialsLevel: authSettings.authenticationType,
        };

        const url = new URL(authSettings.authorizationEndpoint as string);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', authSettings.clientId as string);

        url.searchParams.set(
          'redirect_uri',
          `${window.location.origin}${getUrnForEntity(ApplicationRoute.AssetsToolsets, selectedToolset)}`,
        );

        if (authSettings.codeChallengeMethod) {
          url.searchParams.set('code_challenge_method', authSettings.codeChallengeMethod);
        }

        url.searchParams.set('state', encodeToolsetRedirectState(state));
        if (authSettings.scopesSupported) {
          url.searchParams.set('scope', authSettings.scopesSupported?.join(' '));
        }

        window.location.assign(url.toString());
      } else {
        signIn(type);
      }
    },
    [selectedToolset, signIn],
  );

  const onLogout = useCallback(() => {
    signOutToolset(selectedToolset, ToolsetAuthCredentialLevel.GLOBAL).then((res) => {
      if (res.success) {
        router.push(getUrnForEntity(ApplicationRoute.AssetsToolsets, selectedToolset));
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [router, selectedToolset, showNotification]);

  useEffect(() => {
    if (oAuthCode) {
      signIn(ToolsetAuthCredentialLevel.USER, oAuthCode);
    }
  }, [signIn, oAuthCode]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <div className={headerClassName}>
          {!jsonEditorEnabled && (
            <div className="flex-1 min-w-0">
              <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
            </div>
          )}
          <HeaderButtons
            view={ApplicationRoute.AssetsToolsets}
            entity={selectedToolset}
            isChanged={isChanged}
            onSave={onSave}
            onDiscard={onDiscard}
            removeEntity={onRemove}
            jsonEditorEnabled={jsonEditorEnabled}
            toggleJsonEditor={toggleJsonEditor}
            existingVersions={toolsets?.map((app) => app.version) || []}
            context={useToolsetFolder as () => AssetsFolderContext<DialFile | AssetToolset>}
            childrenContainerClass="flex-row-reverse"
          >
            {isToolsetSignedIn ? (
              <DialButton
                variant={ButtonVariant.Secondary}
                title={t(ToolsetI18nKey.LogOut)}
                iconBefore={<IconLogout {...BASE_ICON_PROPS} />}
                onClick={onLogout}
              />
            ) : (
              <DialButton
                variant={ButtonVariant.Secondary}
                title={t(ToolsetI18nKey.LogIn)}
                iconBefore={<IconLogin {...BASE_ICON_PROPS} />}
                onClick={() => setIsModalOpen(true)}
              />
            )}
          </HeaderButtons>
        </div>
        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {jsonEditorEnabled ? (
            <EntityJsonEditor
              key={key}
              entity={selectedToolset}
              setSelectedEntity={setSelectedToolset}
              setIsChanged={setIsChanged}
            />
          ) : (
            <>
              {activeTab === EntityViewTab.Properties && (
                <ViewContent
                  activeTab={activeTab}
                  names={[]}
                  assets={toolsets || []}
                  view={ApplicationRoute.AssetsToolsets}
                  selectedEntity={selectedToolset}
                  jsonEditorEnabled={jsonEditorEnabled}
                  isSkipRefresh={false}
                  onChangeEntity={onChangeEntity}
                />
              )}

              {activeTab === EntityViewTab.Tools && (
                <ToolsView
                  isAssetToolset={true}
                  originalToolset={originalToolset}
                  selectedToolset={selectedToolset}
                  onChangeToolset={onChangeEntity}
                />
              )}
            </>
          )}
        </div>
      </div>
      {isModalOpen && <LoginPopup isModalOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onLogin={onLogin} />}
    </>
  );
};

export default ToolsetView;
