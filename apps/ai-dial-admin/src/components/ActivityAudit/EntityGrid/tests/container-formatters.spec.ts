import { describe, expect, test } from 'vitest';

import { CONTAINER_ROW_LABEL_KEYS } from '@/src/components/ActivityAudit/EntityGrid/container-formatters';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

describe('container-formatters :: CONTAINER_ROW_LABEL_KEYS', () => {
  test('"nodePoolId" maps to EntityFieldsI18nKey.NodePoolId', () => {
    expect(CONTAINER_ROW_LABEL_KEYS.nodePoolId).toBe(EntityFieldsI18nKey.NodePoolId);
  });

  test('"nodePoolName" maps to EntityFieldsI18nKey.NodePoolName', () => {
    expect(CONTAINER_ROW_LABEL_KEYS.nodePoolName).toBe(EntityFieldsI18nKey.NodePoolName);
  });
});
