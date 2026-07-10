import {
  DialExternalService,
  ExternalServiceCredentialLevel,
  ToolsetAuthStatus,
  ToolsetAuthType,
} from '@/src/models/dial/resource';

const STATE_KEY = 'external-service-auth-state';
const LEVELS_KEY = 'external-service-auth-levels';

export interface ExternalServiceAuthState {
  appPath: string;
  serviceId: string;
  callbackUrl: string;
  authType: ToolsetAuthType;
  redirectUri: string;
  authorizationEndpoint?: string;
  clientId?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  scopes?: string[];
}

export const setExternalServiceAuthState = (state: ExternalServiceAuthState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }
};

export const getExternalServiceAuthState = (): ExternalServiceAuthState | null => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STATE_KEY);
    localStorage.removeItem(STATE_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
};

export const setExternalServiceLevels = (levels: ExternalServiceCredentialLevel[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
  }
};

export const isUserLoggedInToExternalService = (service: DialExternalService): boolean => {
  return service.auth_settings?.user_level_auth_status === ToolsetAuthStatus.SIGNED_IN;
};

export const isApplicationLoggedInToExternalService = (service: DialExternalService): boolean => {
  return service.auth_settings?.app_level_auth_status === ToolsetAuthStatus.SIGNED_IN;
};

export const isLoggedInToExternalService = (service: DialExternalService): boolean => {
  return isUserLoggedInToExternalService(service) || isApplicationLoggedInToExternalService(service);
};

export const isFullLoggedInToExternalService = (service: DialExternalService): boolean => {
  return isUserLoggedInToExternalService(service) && isApplicationLoggedInToExternalService(service);
};

export const getExternalServiceLevels = (): ExternalServiceCredentialLevel[] => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LEVELS_KEY);
    localStorage.removeItem(LEVELS_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  return [];
};
