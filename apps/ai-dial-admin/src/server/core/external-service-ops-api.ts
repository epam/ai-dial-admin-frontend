import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { CoreApi } from './core-api';

const CORE_EXTERNAL_SERVICE_SIGN_IN_URL = 'v1/ops/external-service/signin';
const CORE_EXTERNAL_SERVICE_SIGN_OUT_URL = 'v1/ops/external-service/signout';

export class ExternalServiceOpsApi extends CoreApi {
  signIn(token: Token, body: Record<string, unknown>): Promise<ServerActionResponse> {
    return this.postAction(CORE_EXTERNAL_SERVICE_SIGN_IN_URL, body, token);
  }

  signOut(token: Token, body: Record<string, unknown>): Promise<ServerActionResponse> {
    return this.postAction(CORE_EXTERNAL_SERVICE_SIGN_OUT_URL, body, token);
  }
}
