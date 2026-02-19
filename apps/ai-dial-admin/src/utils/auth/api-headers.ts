import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { Token } from '@/src/models/auth';

export const getApiHeaders = (token: Token): Record<string, string> => {
  return {
    'Content-Type': APPLICATION_JSON_TYPE,
    Accept: APPLICATION_JSON_TYPE,
    ...getAuthorizationHeader(token),
  };
};

export const getAuthorizationHeader = (token: Token) => {
  const headers: Record<string, string> = {};
  if (token) {
    headers['authorization'] = 'Bearer ' + token?.token;
  }

  return headers;
};
