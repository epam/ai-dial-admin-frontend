import { Token } from '@/src/models/auth';
import { UserBucket } from '@/src/models/dial/bucket';
import { CoreApi } from './core-api';

export class BucketApi extends CoreApi {
  /**
   * Returns the authenticated user's storage bucket (`GET /v1/bucket`). The SDK's `Bucket` marks `bucket`
   * optional, but Core always returns it, so the body is read as {@link UserBucket}.
   */
  getBucket(token: Token): Promise<UserBucket | null> {
    return this.sdkGet<UserBucket>(token, (init) => this.sdk.getUserBucket(init));
  }
}
