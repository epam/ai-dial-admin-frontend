import { Token } from '@/src/models/auth';

// `token` comes from `getUserToken`, which has already refreshed an expired access token, so only a
// missing session or a failed refresh makes it invalid — never the expiry stored in the cookie.
export const getIsInvalidSession = async (isEnableAuth: boolean, token?: Token | null) => {
  if (!isEnableAuth) {
    return false;
  }

  return token == null || token.error != null;
};
