import { DialApplication } from '@/src/models/dial/application';
import { isValidAttachment } from './is-valid-model';

export const isValidApplication = (entity: DialApplication) => {
  return (entity.customAppSchemaId != null ? true : !!entity.endpoint) && isValidAttachment(entity.maxInputAttachments);
};
