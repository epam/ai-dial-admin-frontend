'use client';

import { FC, useCallback, useMemo, useRef, useState } from 'react';

import { DialLoader, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconLogin, IconLogout } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { ExternalServiceI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import {
  DialExternalService,
  ExternalServiceCredentialLevel,
  ToolsetAuthCredentialLevel,
  ToolsetAuthType,
} from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import {
  isApplicationLoggedInToExternalService,
  isFullLoggedInToExternalService,
  isUserLoggedInToExternalService,
  setExternalServiceAuthState,
  setExternalServiceLevels,
} from './external-service-auth-utils';
import ResourceLoginPopup from './ResourceLoginPopup';
import ResourceLogoutPopup from './ResourceLogoutPopup';

export const EXTERNAL_SERVICE_AUTH_REDIRECT_URL = '/external-service-signin';

interface Props {
  appPath: string;
  serviceId: string;
  service: DialExternalService;
  signIn: (
    appPath: string,
    serviceId: string,
    level: string,
    authType: string,
    redirectUri?: string,
    apiKey?: string,
    code?: string,
  ) => Promise<ServerActionResponse>;
  signOut: (appPath: string, serviceId: string, level: string, authType: string) => Promise<ServerActionResponse>;
  onLoadingChange?: (loading: boolean) => void;
}

const ExternalServiceAuthButtons: FC<Props> = ({ appPath, serviceId, service, signIn, signOut, onLoadingChange }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback(
    (loading: boolean) => {
      setIsLoading(loading);
      onLoadingChange?.(loading);
    },
    [onLoadingChange],
  );

  const isFullSignedIn = useMemo(() => isFullLoggedInToExternalService(service), [service]);
  const isUserSignedIn = useMemo(() => isUserLoggedInToExternalService(service), [service]);
  const isApplicationSignedIn = useMemo(() => isApplicationLoggedInToExternalService(service), [service]);

  const authType = service.auth_settings?.authentication_type;
  const authSettings = service.auth_settings;

  const levelToCredential = useCallback((level: ToolsetAuthCredentialLevel): ExternalServiceCredentialLevel => {
    return level === ToolsetAuthCredentialLevel.USER
      ? ExternalServiceCredentialLevel.USER
      : ExternalServiceCredentialLevel.APPLICATION;
  }, []);

  const startOAuthFlow = useCallback(
    (levels: ExternalServiceCredentialLevel[]) => {
      if (!authSettings) return;
      const url = new URL(authSettings.authorization_endpoint as string);
      const redirectUri = `${window.location.origin}${EXTERNAL_SERVICE_AUTH_REDIRECT_URL}`;

      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', authSettings.client_id as string);
      url.searchParams.set('redirect_uri', redirectUri);
      if (authSettings.code_challenge) {
        url.searchParams.set('code_challenge', authSettings.code_challenge);
      }
      if (authSettings.code_challenge_method) {
        url.searchParams.set('code_challenge_method', authSettings.code_challenge_method);
      }
      if (authSettings.scopes_supported) {
        url.searchParams.set('scope', authSettings.scopes_supported.join(' '));
      }

      setExternalServiceLevels(levels);
      setExternalServiceAuthState({
        appPath,
        serviceId,
        callbackUrl: window.location.pathname,
        authType: ToolsetAuthType.OAUTH,
        redirectUri,
        authorizationEndpoint: authSettings.authorization_endpoint,
        clientId: authSettings.client_id,
        codeChallenge: authSettings.code_challenge,
        codeChallengeMethod: authSettings.code_challenge_method,
        scopes: authSettings.scopes_supported,
      });

      window.location.assign(url.toString());
    },
    [appPath, authSettings, serviceId],
  );

  const onLogin = useCallback(
    (toolsetLevels: ToolsetAuthCredentialLevel[], apiKeyValue: string) => {
      if (!toolsetLevels.length || !authType) return;

      const levels = toolsetLevels.map(levelToCredential);

      if (authType === ToolsetAuthType.OAUTH) {
        startOAuthFlow(levels);
      } else {
        setIsLoginModalOpen(false);
        setLoading(true);
        let completed = 0;
        let hasError = false;

        levels.forEach((level) => {
          getReqRef
            .current(signIn, appPath, serviceId, level, authType, undefined, apiKeyValue)
            .then((res: ServerActionResponse) => {
              completed++;
              if (!res.success) {
                hasError = true;
                showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
              }
              if (completed === levels.length) {
                setLoading(false);
                if (!hasError) {
                  showNotification(
                    getSuccessNotification(
                      t(ExternalServiceI18nKey.SuccessLogin),
                      t(ExternalServiceI18nKey.SuccessLoginDescription),
                    ),
                  );
                  router.refresh();
                }
              }
            });
        });
      }
    },
    [appPath, authType, levelToCredential, router, serviceId, setLoading, signIn, showNotification, startOAuthFlow, t],
  );

  const performLogout = useCallback(
    (toolsetLevels: ToolsetAuthCredentialLevel[]) => {
      setIsLogoutConfirmationOpen(false);
      if (!authType) return;

      setLoading(true);
      const levels = toolsetLevels.map(levelToCredential);
      let completed = 0;
      let hasError = false;

      levels.forEach((level) => {
        getReqRef.current(signOut, appPath, serviceId, level, authType).then((res: ServerActionResponse) => {
          completed++;
          if (!res.success) {
            hasError = true;
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
          }
          if (completed === levels.length) {
            setLoading(false);
            if (!hasError) {
              showNotification(
                getSuccessNotification(
                  t(ExternalServiceI18nKey.SuccessLogout),
                  t(ExternalServiceI18nKey.SuccessLogoutDescription),
                ),
              );
              router.refresh();
            }
          }
        });
      });
    },
    [appPath, authType, levelToCredential, router, serviceId, setLoading, signOut, showNotification, t],
  );

  const onLogout = useCallback(() => {
    if (isFullSignedIn) {
      setIsLogoutConfirmationOpen(true);
    } else {
      const level = isUserSignedIn ? ToolsetAuthCredentialLevel.USER : ToolsetAuthCredentialLevel.GLOBAL;
      performLogout([level]);
    }
  }, [isFullSignedIn, isUserSignedIn, performLogout]);

  if (!authType || authType === ToolsetAuthType.NONE) return null;

  if (isLoading) return <DialLoader fullWidth={false} size={16} />;

  return (
    <>
      {(isUserSignedIn || isApplicationSignedIn) && (
        <DialNeutralButton
          label={t(ToolsetI18nKey.LogOut)}
          iconBefore={<IconLogout {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onLogout}
        />
      )}
      {!isFullSignedIn && (
        <DialNeutralButton
          label={t(ToolsetI18nKey.LogIn)}
          iconBefore={<IconLogin {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => setIsLoginModalOpen(true)}
        />
      )}
      {isLoginModalOpen && (
        <ResourceLoginPopup
          type={authType}
          isModalOpen={isLoginModalOpen}
          isLoggedInAsUser={isUserSignedIn}
          isLoggedInAsOrganization={isApplicationSignedIn}
          orgLabel={t(ExternalServiceI18nKey.ApplicationLevel)}
          userLabel={t(ExternalServiceI18nKey.UserLevel)}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={onLogin}
        />
      )}
      {isLogoutConfirmationOpen && (
        <ResourceLogoutPopup
          isModalOpen={isLogoutConfirmationOpen}
          isLoggedInAsUser={isUserSignedIn}
          isLoggedInAsOrganization={isApplicationSignedIn}
          orgLabel={t(ExternalServiceI18nKey.ApplicationLevel)}
          userLabel={t(ExternalServiceI18nKey.UserLevel)}
          onClose={() => setIsLogoutConfirmationOpen(false)}
          onConfirm={performLogout}
        />
      )}
    </>
  );
};

export default ExternalServiceAuthButtons;
