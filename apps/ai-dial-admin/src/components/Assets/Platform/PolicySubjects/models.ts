import { DialPolicyResource } from '@/src/models/dial/resource';

export interface PolicyCreateDraft extends DialPolicyResource {
  folderId?: string;
  policy?: string;
}
