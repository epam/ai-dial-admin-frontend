import { RollbackI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import {
  getRollbackErrorDescription,
  getRollbackErrorTitle,
  getRollbackSuccessDescription,
  getRollbackSuccessTitle,
} from '../rollback-entity';

describe('Rollback :: utils', () => {
  const tWithProps = (str: string, props?: Record<string, string>) => str + ' with props';

  test('getRollbackSuccessTitle returns a string', () => {
    expect(getRollbackSuccessTitle(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationSuccessTitle} with props`,
    );
  });

  test('getRollbackSuccessDescription returns a string', () => {
    expect(getRollbackSuccessDescription(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationSuccessDescription} with props`,
    );
  });

  test('getRollbackErrorTitle returns a string', () => {
    expect(getRollbackErrorTitle(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationErrorTitle} with props`,
    );
  });

  test('getRollbackErrorDescription returns a string', () => {
    expect(getRollbackErrorDescription(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationErrorDescription} with props`,
    );
  });

  test.each([
    ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
    ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
    ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
    ActivityAuditResourceType.MCP_DEPLOYMENT,
    ActivityAuditResourceType.NIM_DEPLOYMENT,
    ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
  ])('getRollbackSuccessTitle maps deployment %s to the Deployment label', (type) => {
    expect(getRollbackSuccessTitle(type, tWithProps)).toContain(RollbackI18nKey.NotificationSuccessTitle);
  });

  test.each([
    ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
  ])('getRollbackSuccessTitle maps image definition %s to the ImageDefinition label', (type) => {
    expect(getRollbackSuccessTitle(type, tWithProps)).toContain(RollbackI18nKey.NotificationSuccessTitle);
  });

  test('getRollbackSuccessTitle maps the whitelist to the ImageBuildDomainWhitelist label', () => {
    expect(getRollbackSuccessTitle(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, tWithProps)).toContain(
      RollbackI18nKey.NotificationSuccessTitle,
    );
  });
});
