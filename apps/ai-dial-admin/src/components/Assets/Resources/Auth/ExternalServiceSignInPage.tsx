'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useEffect } from 'react';

import { signInExternalService } from '@/src/app/[lang]/assets-applications/actions';
import {
  ExternalServiceAuthState,
  getExternalServiceAuthState,
  getExternalServiceLevels,
  setExternalServiceAuthState,
  setExternalServiceLevels,
} from './external-service-auth-utils';
import { ExternalServiceCredentialLevel } from '@/src/models/dial/resource';

interface Props {
  oAuthCode?: string | null;
}

const reInitiateOAuth = (state: ExternalServiceAuthState, remainingLevels: ExternalServiceCredentialLevel[]) => {
  const url = new URL(state.authorizationEndpoint as string);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', state.clientId as string);
  url.searchParams.set('redirect_uri', state.redirectUri);
  if (state.codeChallenge) {
    url.searchParams.set('code_challenge', state.codeChallenge);
  }
  if (state.codeChallengeMethod) {
    url.searchParams.set('code_challenge_method', state.codeChallengeMethod);
  }
  if (state.scopes) {
    url.searchParams.set('scope', state.scopes.join(' '));
  }

  setExternalServiceAuthState(state);
  setExternalServiceLevels(remainingLevels);

  window.location.assign(url.toString());
};

export const ExternalServiceSignInPage: FC<Props> = ({ oAuthCode }) => {
  const router = useRouter();

  useEffect(() => {
    const state = getExternalServiceAuthState();
    if (!state || !oAuthCode) return;

    const levels = getExternalServiceLevels();
    if (!levels.length) return;

    const [currentLevel, ...remainingLevels] = levels;

    signInExternalService(
      state.appPath,
      state.serviceId,
      currentLevel,
      state.authType,
      state.redirectUri,
      undefined,
      oAuthCode,
    ).then((res) => {
      if (!res.success) {
        router.push(state.callbackUrl);
        return;
      }

      if (remainingLevels.length > 0 && state.authorizationEndpoint && state.clientId) {
        reInitiateOAuth(state, remainingLevels);
      } else {
        router.push(state.callbackUrl);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DialLoader size={44} />;
};
