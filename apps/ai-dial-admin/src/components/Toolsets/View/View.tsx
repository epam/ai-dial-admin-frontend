'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconLogin, IconLogout } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import {
  getCoreToolset,
  removeToolset,
  signInToolset,
  signOutToolset,
  updateCoreToolset,
  updateToolset,
} from '@/src/app/[lang]/toolsets/actions';
import LoginPopup from '@/src/components/Assets/Toolsets/LoginPopup';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import EntityRolesModal from '@/src/components/EntityView/Modals/EmptyRoles/EmptyRoles';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import Tools from '@/src/components/Tools/Tools';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { Toolset, ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getToolsetTabs } from '@/src/utils/tabs/utils';
import {
  encodeToolsetRedirectState,
  isLoggedInToToolset,
  isUserLoggedInToToolset,
} from '@/src/utils/toolset/toolset-auth';
import ToolsetProperties from './Properties';

let isSignInProcessed = false;

interface Props {
  etag: string;
  names: string[];
  roles?: DialRole[] | null;
  originalToolset: Toolset;
  oAuthCode?: string | null;
  isUserLevel?: boolean;
}

const ToolsetView: FC<Props> = ({ names, isUserLevel, oAuthCode, etag, roles, originalToolset }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs = getToolsetTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreToolset, setCoreToolset] = useState<Toolset | null>(null);

  const isToolsetSignedIn = useMemo(() => {
    return isLoggedInToToolset(selectedToolset);
  }, [selectedToolset]);

  useEffect(() => {
    const name = originalToolset?.name;
    if (!coreToolset && name) {
      getReqRef.current(getCoreToolset, name).then((data) => {
        setCoreToolset(data.response);
      });
    }
  }, [coreToolset, originalToolset]);

  useEffect(() => {
    setSelectedToolset(
      selectedFormat === ExportFormat.CORE ? cloneDeep(coreToolset as Toolset) : cloneDeep(originalToolset),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalToolset]);

  useEffect(() => {
    const isEqualAdminToolset = isEqualSkippingUndefined(originalToolset, selectedToolset);
    const isEqualCoreToolset = isEqualSkippingUndefined(selectedToolset, coreToolset);
    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreToolset : !isEqualAdminToolset);
  }, [selectedFormat, originalToolset, selectedToolset, coreToolset]);

  const onDiscard = useCallback(() => {
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    dispatch({ type: ValidationActionType.Reset });
    setSelectedToolset(originalToolset);
    setIsSkipRefresh(false);
  }, [isJsonEditorEnabled, originalToolset, dispatch]);

  const onChangeToolset = useCallback(
    (entity: Toolset, skipRefresh?: boolean) => {
      setSelectedToolset(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedToolset],
  );

  const onToggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setIsJsonEditorEnabled((prev) => !prev);
  }, [setIsJsonEditorEnabled]);

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(
            updateCoreToolset,
            selectedToolset as Record<string, unknown>,
            originalToolset.name || '',
            etag,
          )
        : getReqRef.current(updateToolset, selectedToolset, etag);

    req.then((res) => {
      if (res.success) {
        setCoreToolset(null);
        dispatch({ type: ValidationActionType.Reset });
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Toolsets, t),
            getUpdateNotificationDescription(ApplicationRoute.Toolsets, selectedToolset.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
      setIsModalOpen(false);
    });
  }, [selectedFormat, selectedToolset, originalToolset.name, etag, dispatch, showNotification, t, router]);

  const onTryToSave = useCallback(() => {
    if (
      selectedFormat !== ExportFormat.CORE &&
      isDisableRole(selectedToolset as EntityRoleLimits) &&
      !isJsonEditorEnabled
    ) {
      setIsModalOpen(true);
    } else {
      onSave();
    }
  }, [isJsonEditorEnabled, onSave, selectedFormat, selectedToolset]);

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
        router.push(getUrnForEntity(ApplicationRoute.Toolsets, selectedToolset));
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
          `${window.location.origin}${getUrnForEntity(ApplicationRoute.Toolsets, selectedToolset)}?isUser=${type === ToolsetAuthCredentialLevel.USER}`,
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
        router.push(getUrnForEntity(ApplicationRoute.Toolsets, selectedToolset));
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
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
        <Tabs
          tabs={tabs}
          isEditorEnabled={isJsonEditorEnabled}
          activeTab={activeTab}
          onChangeActiveTab={setActiveTab}
        />

        <HeaderButtons
          view={ApplicationRoute.Toolsets}
          entity={selectedToolset}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onTryToSave}
          onRemove={removeToolset}
          isEditorEnabled={isJsonEditorEnabled}
          onToggleEditor={onToggleJsonEditor}
          selectedFormat={selectedFormat}
          onChangeSelectedFormat={setSelectedFormat}
        >
          {selectedToolset.authSettings?.authenticationType &&
          selectedToolset.authSettings?.authenticationType !== ToolsetAuthType.NONE ? (
            isToolsetSignedIn ? (
              <DialNeutralButton
                label={t(ToolsetI18nKey.LogOut)}
                iconBefore={<IconLogout {...BASE_BUTTON_ICON_PROPS} />}
                onClick={onLogout}
              />
            ) : (
              <DialNeutralButton
                label={t(ToolsetI18nKey.LogIn)}
                iconBefore={<IconLogin {...BASE_BUTTON_ICON_PROPS} />}
                onClick={() => setIsLoginModalOpen(true)}
              />
            )
          ) : null}
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
              <ToolsetProperties names={names} selectedToolset={selectedToolset} onChangeToolset={onChangeToolset} />
            )}

            {activeTab === EntityViewTab.Tools && (
              <Tools
                originalToolset={originalToolset}
                selectedToolset={selectedToolset}
                onChangeToolset={onChangeToolset}
              />
            )}

            {activeTab === EntityViewTab.Roles && (
              <EntityRoles
                entity={selectedToolset}
                view={ApplicationRoute.Toolsets}
                roles={roles || []}
                onChangeEntity={onChangeToolset}
                isSkipRefresh={isSkipRefresh}
              />
            )}

            {activeTab === EntityViewTab.Audit && (
              <EntityAudit entity={selectedToolset} view={ApplicationRoute.Toolsets} />
            )}

            {isModalOpen && (
              <EntityRolesModal
                onConfirm={() => onSave()}
                onClose={() => setIsModalOpen(false)}
                onCancel={() => setIsModalOpen(false)}
              />
            )}
            {isLoginModalOpen && (
              <LoginPopup
                type={selectedToolset.authSettings?.authenticationType}
                isModalOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLogin={onLogin}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ToolsetView;
