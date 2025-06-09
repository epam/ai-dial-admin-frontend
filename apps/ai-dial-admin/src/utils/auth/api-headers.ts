import { JWT } from 'next-auth/jwt';

import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';

export const getApiHeaders = (token?: JWT | null): Record<string, string> => {
  return {
    'Content-Type': APPLICATION_JSON_TYPE,
    Accept: APPLICATION_JSON_TYPE,
    ...getAuthorizationHeader(token),
  };
};

export const getAuthorizationHeader = (token?: JWT | null) => {
  const headers: Record<string, string> = {};
  if (token) {
    headers['authorization'] = 'Bearer ' + token?.access_token;
  }

  return headers;
};
