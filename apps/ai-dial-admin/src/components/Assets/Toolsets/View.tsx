'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNeutralButton, DialTabs } from '@epam/ai-dial-ui-kit';
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
import Tools from '@/src/components/Tools/Tools';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { Toolset, ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import {
  encodeToolsetRedirectState,
  isLoggedInToToolset,
  isUserLoggedInToToolset,
} from '@/src/utils/toolset/toolset-auth';
import { addTrailingSlash } from '@/src/utils/url';
import LoginPopup from './LoginPopup';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
let isSignInProcessed = false;

interface Props {
  etag: string;
  oAuthCode?: string | null;
  isUserLevel?: boolean;
  originalToolset: AssetToolset;
  toolsets: AssetToolset[];
}

const ToolsetView: FC<Props> = ({ oAuthCode, etag, originalToolset, toolsets, isUserLevel }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsToolsets);
  const router = useRouter();
  const { fetchFiles } = useToolsetFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);

  const isToolsetSignedIn = useMemo(() => {
    return isLoggedInToToolset(selectedToolset);
  }, [selectedToolset]);

  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

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
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedToolset(cloneDeep(originalToolset));
  }, [isJsonEditorEnabled, originalToolset, dispatch]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedToolset, originalToolset);
      let updatedEntity = getEntityForUpdate(selectedToolset, originalToolset);
      if (newVersion) {
        updatedEntity = addNewVersion(updatedEntity, newVersion);
      }
      getReqRef.current(updateToolset, updatedEntity, etag).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(
              getUpdateNotificationTitle(ApplicationRoute.AssetsToolsets, t),
              getUpdateNotificationDescription(ApplicationRoute.AssetsToolsets, updatedEntity.name, t),
            ),
          );
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
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
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

  const onToggleJsonEditor = useCallback(() => {
    setIsJsonEditorEnabled((prev) => !prev);
  }, [setIsJsonEditorEnabled]);

  const onRemove = useCallback(
    (entity: string) => {
      return removeToolset(entity, etag);
    },
    [etag],
  );

  const signIn = useCallback(
    (type: ToolsetAuthCredentialLevel, apiKeyValue?: string, code?: string) => {
      isSignInProcessed = true;
      getReqRef.current(signInToolset, selectedToolset, type, apiKeyValue, code).then((res) => {
        isSignInProcessed = false;
        if (!res.success) {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        } else {
          showNotification(
            getSuccessNotification(t(ToolsetI18nKey.SuccessLogin), t(ToolsetI18nKey.SuccessLoginDescription)),
          );
        }
        router.push(getUrnForEntity(ApplicationRoute.AssetsToolsets, selectedToolset));
      });
    },
    [router, selectedToolset, showNotification, t],
  );

  const onLogin = useCallback(
    (type: ToolsetAuthCredentialLevel, apiKeyValue: string) => {
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
          `${window.location.origin}${getUrnForEntity(ApplicationRoute.AssetsToolsets, selectedToolset)}&isUser=${type === ToolsetAuthCredentialLevel.USER}`,
        );
        if (authSettings.codeChallenge) {
          url.searchParams.set('code_challenge', authSettings.codeChallenge);
        }
        if (authSettings.codeChallengeMethod) {
          url.searchParams.set('code_challenge_method', authSettings.codeChallengeMethod);
        }

        url.searchParams.set('state', encodeToolsetRedirectState(state));
        if (authSettings.scopesSupported) {
          url.searchParams.set('scope', authSettings.scopesSupported?.join(' '));
        }

        window.location.assign(url.toString());
      } else {
        signIn(type, apiKeyValue);
      }
    },
    [selectedToolset, signIn],
  );

  const onLogout = useCallback(() => {
    const level = isUserLoggedInToToolset(selectedToolset)
      ? ToolsetAuthCredentialLevel.USER
      : ToolsetAuthCredentialLevel.GLOBAL;
    getReqRef.current(signOutToolset, selectedToolset, level).then((res) => {
      if (res.success) {
        router.push(getUrnForEntity(ApplicationRoute.AssetsToolsets, selectedToolset));
        showNotification(
          getSuccessNotification(t(ToolsetI18nKey.SuccessLogout), t(ToolsetI18nKey.SuccessLogoutDescription)),
        );
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [router, selectedToolset, showNotification, t]);

  useEffect(() => {
    if (oAuthCode && !isSignInProcessed) {
      signIn(isUserLevel ? ToolsetAuthCredentialLevel.USER : ToolsetAuthCredentialLevel.GLOBAL, void 0, oAuthCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
          {!isJsonEditorEnabled && (
            <div className="flex-1 min-w-0">
              <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
            </div>
          )}
          <HeaderButtons
            view={ApplicationRoute.AssetsToolsets}
            entity={selectedToolset}
            onChangeEntity={onChangeEntity}
            isChanged={isChanged}
            onSave={onSave}
            onDiscard={onDiscard}
            onRemove={onRemove}
            isEditorEnabled={isJsonEditorEnabled}
            onToggleEditor={onToggleJsonEditor}
            assets={toolsets || []}
            etag={etag}
            getAssetContext={useToolsetFolder as () => AssetsFolderContext<DialFile | AssetToolset>}
          >
            {selectedToolset.authSettings?.authenticationType !== ToolsetAuthType.NONE &&
              (isToolsetSignedIn ? (
                <DialNeutralButton
                  label={t(ToolsetI18nKey.LogOut)}
                  iconBefore={<IconLogout {...BASE_BUTTON_ICON_PROPS} />}
                  onClick={onLogout}
                />
              ) : (
                <DialNeutralButton
                  label={t(ToolsetI18nKey.LogIn)}
                  iconBefore={<IconLogin {...BASE_BUTTON_ICON_PROPS} />}
                  onClick={() => setIsModalOpen(true)}
                />
              ))}
          </HeaderButtons>
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {isJsonEditorEnabled ? (
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
                  view={ApplicationRoute.AssetsToolsets}
                  selectedEntity={selectedToolset}
                  isJsonEditorEnabled={isJsonEditorEnabled}
                  isSkipRefresh={false}
                  onChangeEntity={onChangeEntity}
                />
              )}

              {activeTab === EntityViewTab.Tools && (
                <Tools
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
      {isModalOpen && (
        <LoginPopup
          type={selectedToolset.authSettings?.authenticationType}
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onLogin={onLogin}
        />
      )}
    </>
  );
};

export default ToolsetView;
