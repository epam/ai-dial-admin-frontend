import { DialExternalService, ExternalServiceCredentialLevel, ToolsetAuthStatus } from '@/src/models/dial/resource';

const LEVELS_KEY = 'external-service-auth-levels';
const URL_KEY = 'external-service-auth-url';
const SERVICE_ID_KEY = 'external-service-auth-service-id';

export const setExternalServiceUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(URL_KEY, url);
  }
};

export const getExternalServiceUrl = (): string | null => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem(URL_KEY);
    localStorage.removeItem(URL_KEY);
    return url;
  }
  return null;
};

export const setExternalServiceServiceId = (id: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SERVICE_ID_KEY, id);
  }
};

export const peekExternalServiceServiceId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SERVICE_ID_KEY);
  }
  return null;
};

export const consumeExternalServiceServiceId = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SERVICE_ID_KEY);
  }
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
