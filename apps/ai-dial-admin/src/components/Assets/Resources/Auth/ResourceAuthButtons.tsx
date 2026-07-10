'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconLogin, IconLogout } from '@tabler/icons-react';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

import { DialToolsetResource, ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/resource';
import {
  encodeToolsetRedirectState,
  getLevels,
  isAdminLoggedInToToolset,
  isFullLoggedInToToolset,
  isUserLoggedInToToolset,
  setLevels,
  setUrl,
} from '../utils';
import ResourceLoginPopup from './ResourceLoginPopup';
import ResourceLogoutPopup from './ResourceLogoutPopup';

export const TOOLSET_AUTH_REDIRECT_URL = '/toolset-signin';

let isSignInProcessed = false;

interface Props {
  view: ApplicationRoute;
  oAuthCode?: string | null;
  selectedToolset: DialToolsetResource;
  publicationName?: string;
  publicationPath?: string;
  signInToolset: (
    toolset: any,
    type: ToolsetAuthCredentialLevel,
    redirectUrl: string,
    apiKeyValue?: string,
    code?: string,
  ) => Promise<ServerActionResponse>;
  signOutToolset: (toolset: any, type: ToolsetAuthCredentialLevel) => Promise<ServerActionResponse>;
}

const ResourceAuthButtons: FC<Props> = ({
  selectedToolset,
  publicationName,
  oAuthCode,
  view,
  publicationPath,
  signInToolset,
  signOutToolset,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);

  const isToolsetFullSignedIn = useMemo(() => {
    return isFullLoggedInToToolset(selectedToolset);
  }, [selectedToolset]);

  const isUserLevelSignedIn = useMemo(() => {
    return isUserLoggedInToToolset(selectedToolset);
  }, [selectedToolset]);

  const isOrgLevelSignedIn = useMemo(() => {
    return isAdminLoggedInToToolset(selectedToolset);
  }, [selectedToolset]);

  const startOAuthFlow = useCallback(
    (levels: ToolsetAuthCredentialLevel[]) => {
      const authSettings = selectedToolset.auth_settings!;
      const url = new URL(authSettings.authorization_endpoint as string);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', authSettings.client_id as string);

      setLevels(levels);
      setUrl(view, { ...selectedToolset, requestName: publicationName, path: publicationPath });

      url.searchParams.set('redirect_uri', `${window.location.origin}${TOOLSET_AUTH_REDIRECT_URL}`);
      if (authSettings.code_challenge) {
        url.searchParams.set('code_challenge', authSettings.code_challenge);
      }
      if (authSettings.code_challenge_method) {
        url.searchParams.set('code_challenge_method', authSettings.code_challenge_method);
      }
      const state = {
        callbackUrl: window.location.pathname,
        toolsetId: selectedToolset.name,
        credentialsLevel: authSettings.authentication_type,
      };
      url.searchParams.set('state', encodeToolsetRedirectState(state));
      if (authSettings.scopes_supported) {
        url.searchParams.set('scope', authSettings.scopes_supported.join(' '));
      }

      window.location.assign(url.toString());
    },
    [publicationName, publicationPath, selectedToolset, view],
  );

  const onLogin = useCallback(
    (levels: ToolsetAuthCredentialLevel[], apiKeyValue: string) => {
      if (!levels.length) {
        return;
      }

      const authSettings = selectedToolset.auth_settings;
      if (authSettings && authSettings?.authentication_type === ToolsetAuthType.OAUTH) {
        startOAuthFlow(levels);
      } else {
        setIsLoginModalOpen(false);

        let completedCount = 0;
        let hasError = false;

        levels.forEach((level) => {
          getReqRef
            .current(
              signInToolset,
              selectedToolset,
              level,
              `${window.location.origin}${TOOLSET_AUTH_REDIRECT_URL}`,
              apiKeyValue,
            )
            .then((res) => {
              completedCount++;
              if (!res.success) {
                hasError = true;
                showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
              }

              if (completedCount === levels.length && !hasError) {
                showNotification(
                  getSuccessNotification(t(ToolsetI18nKey.SuccessLogin), t(ToolsetI18nKey.SuccessLoginDescription)),
                );
                router.push(
                  getUrnForEntity(view, { ...selectedToolset, requestName: publicationName, path: publicationPath }),
                );
              }
            });
        });
      }
    },
    [
      publicationName,
      publicationPath,
      selectedToolset,
      signInToolset,
      showNotification,
      t,
      router,
      view,
      startOAuthFlow,
    ],
  );

  const performLogout = useCallback(
    (levels: ToolsetAuthCredentialLevel[]) => {
      setIsLogoutConfirmationOpen(false);
      let completedCount = 0;
      let hasError = false;

      levels.forEach((level) => {
        getReqRef.current(signOutToolset, selectedToolset, level).then((res) => {
          completedCount++;
          if (!res.success) {
            hasError = true;
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
          }

          // After all logout requests complete, show success or navigate
          if (completedCount === levels.length) {
            if (!hasError) {
              router.push(
                getUrnForEntity(view, { ...selectedToolset, requestName: publicationName, path: publicationPath }),
              );
              showNotification(
                getSuccessNotification(t(ToolsetI18nKey.SuccessLogout), t(ToolsetI18nKey.SuccessLogoutDescription)),
              );
            }
          }
        });
      });
    },
    [router, selectedToolset, view, showNotification, t, signOutToolset, publicationName, publicationPath],
  );

  const onLogout = useCallback(() => {
    // If logged in at both levels, show confirmation modal
    if (isToolsetFullSignedIn) {
      setIsLogoutConfirmationOpen(true);
    } else {
      // If logged in at only one level, proceed directly
      const level = isUserLevelSignedIn ? ToolsetAuthCredentialLevel.USER : ToolsetAuthCredentialLevel.GLOBAL;
      performLogout([level]);
    }
  }, [isToolsetFullSignedIn, isUserLevelSignedIn, performLogout]);

  useEffect(() => {
    if (oAuthCode && !isSignInProcessed) {
      const levels = getLevels();
      if (!levels.length) return;

      isSignInProcessed = true;
      const [currentLevel, ...remainingLevels] = levels;

      getReqRef
        .current(
          signInToolset,
          selectedToolset,
          currentLevel,
          `${window.location.origin}${TOOLSET_AUTH_REDIRECT_URL}`,
          void 0,
          oAuthCode,
        )
        .then((res) => {
          isSignInProcessed = false;
          if (!res.success) {
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
            router.push(
              getUrnForEntity(view, { ...selectedToolset, requestName: publicationName, path: publicationPath }),
            );
            return;
          }

          if (remainingLevels.length > 0) {
            // OAuth codes are single-use — initiate a fresh authorization round for the next level
            startOAuthFlow(remainingLevels);
          } else {
            showNotification(
              getSuccessNotification(t(ToolsetI18nKey.SuccessLogin), t(ToolsetI18nKey.SuccessLoginDescription)),
            );
            router.push(
              getUrnForEntity(view, { ...selectedToolset, requestName: publicationName, path: publicationPath }),
            );
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {selectedToolset.auth_settings?.authentication_type &&
      selectedToolset.auth_settings?.authentication_type !== ToolsetAuthType.NONE ? (
        <>
          {(isUserLevelSignedIn || isOrgLevelSignedIn) && (
            <DialNeutralButton
              label={t(ToolsetI18nKey.LogOut)}
              iconBefore={<IconLogout {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onLogout}
            />
          )}
          {!isToolsetFullSignedIn && (
            <DialNeutralButton
              label={t(ToolsetI18nKey.LogIn)}
              iconBefore={<IconLogin {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => setIsLoginModalOpen(true)}
            />
          )}
        </>
      ) : null}
      {isLoginModalOpen && (
        <ResourceLoginPopup
          type={selectedToolset.auth_settings?.authentication_type}
          isModalOpen={isLoginModalOpen}
          isLoggedInAsUser={isUserLevelSignedIn}
          isLoggedInAsOrganization={isOrgLevelSignedIn}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={onLogin}
        />
      )}
      {isLogoutConfirmationOpen && (
        <ResourceLogoutPopup
          isModalOpen={isLogoutConfirmationOpen}
          isLoggedInAsUser={isUserLevelSignedIn}
          isLoggedInAsOrganization={isOrgLevelSignedIn}
          onClose={() => setIsLogoutConfirmationOpen(false)}
          onConfirm={performLogout}
        />
      )}
    </>
  );
};

export default ResourceAuthButtons;
