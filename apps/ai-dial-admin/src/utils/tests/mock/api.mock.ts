import { Token } from '@/src/models/auth';

export const TEST_URL = 'test/';
// SDK-backed Core calls build a `Request`, which rejects a relative URL such as `TEST_URL`.
export const CORE_TEST_URL = 'http://core.test/';
export const RESPONSE_MOCK = { success: true };
export const TOKEN_MOCK = {
  access_token: 'access_token_mock',
  token: 'access_token_mock',
} as unknown as Token;
