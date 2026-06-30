import { CORE_BUCKET_URL } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { UserBucket } from '@/src/models/dial/bucket';
import { CoreApi } from './core-api';

export class BucketApi extends CoreApi {
  /** Returns the authenticated user's storage bucket (`GET /v1/bucket`). */
  getBucket(token: Token): Promise<UserBucket | null> {
    return this.get<UserBucket>(CORE_BUCKET_URL, token);
  }
}
