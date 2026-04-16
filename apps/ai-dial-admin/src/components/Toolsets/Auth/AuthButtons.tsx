'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconLogin, IconLogout } from '@tabler/icons-react';

import LoginPopup from '@/src/components/Toolsets/Auth/LoginPopup';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import {
  encodeToolsetRedirectState,
  isLoggedInToToolset,
  isUserLoggedInToToolset,
} from '@/src/utils/toolset/toolset-auth';
import { getIsUser, setIsUser, setUrl } from './utils';

export const TOOLSET_AUTH_REDIRECT_URL = '/toolset-signin';

let isSignInProcessed = false;

interface Props {
  view: ApplicationRoute;
  oAuthCode?: string | null;
  selectedToolset: Toolset;
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

const AuthButtons: FC<Props> = ({
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

  const isToolsetSignedIn = useMemo(() => {
    return isLoggedInToToolset(selectedToolset);
  }, [selectedToolset]);

  const signIn = useCallback(
    (type: ToolsetAuthCredentialLevel, apiKeyValue?: string, code?: string) => {
      isSignInProcessed = true;
      getReqRef
        .current(
          signInToolset,
          selectedToolset,
          type,
          `${window.location.origin}${TOOLSET_AUTH_REDIRECT_URL}`,
          apiKeyValue,
          code,
        )
        .then((res) => {
          isSignInProcessed = false;
          if (!res.success) {
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
          } else {
            showNotification(
              getSuccessNotification(t(ToolsetI18nKey.SuccessLogin), t(ToolsetI18nKey.SuccessLoginDescription)),
            );
          }
          router.push(
            getUrnForEntity(view, { ...selectedToolset, requestName: publicationName, path: publicationPath }),
          );
        });
    },
    [router, selectedToolset, showNotification, signInToolset, t, view, publicationName, publicationPath],
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

        setIsUser(type);
        setUrl(view, selectedToolset);
        url.searchParams.set('redirect_uri', `${window.location.origin}${TOOLSET_AUTH_REDIRECT_URL}`);
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
    [selectedToolset, signIn, view],
  );

  const onLogout = useCallback(() => {
    const level = isUserLoggedInToToolset(selectedToolset)
      ? ToolsetAuthCredentialLevel.USER
      : ToolsetAuthCredentialLevel.GLOBAL;
    getReqRef.current(signOutToolset, selectedToolset, level).then((res) => {
      if (res.success) {
        router.push(getUrnForEntity(view, { ...selectedToolset, requestName: publicationName, path: publicationPath }));
        showNotification(
          getSuccessNotification(t(ToolsetI18nKey.SuccessLogout), t(ToolsetI18nKey.SuccessLogoutDescription)),
        );
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [router, selectedToolset, view, showNotification, t, signOutToolset, publicationName, publicationPath]);

  useEffect(() => {
    if (oAuthCode && !isSignInProcessed) {
      signIn(getIsUser() ? ToolsetAuthCredentialLevel.USER : ToolsetAuthCredentialLevel.GLOBAL, void 0, oAuthCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
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
      {isLoginModalOpen && (
        <LoginPopup
          type={selectedToolset.authSettings?.authenticationType}
          isModalOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={onLogin}
        />
      )}
    </>
  );
};

export default AuthButtons;
