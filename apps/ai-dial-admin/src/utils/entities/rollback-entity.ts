import { RollbackI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';

const rollbackEntityMap: Record<string, RollbackI18nKey> = {
  [ActivityAuditResourceType.MODEL]: RollbackI18nKey.Model,
  [ActivityAuditResourceType.APPLICATION]: RollbackI18nKey.Application,
  [ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA]: RollbackI18nKey.ApplicationRunner,
  [ActivityAuditResourceType.KEY]: RollbackI18nKey.Key,
  [ActivityAuditResourceType.ROLE]: RollbackI18nKey.Role,
  [ActivityAuditResourceType.INTERCEPTOR]: RollbackI18nKey.Interceptor,
  [ActivityAuditResourceType.ROUTE]: RollbackI18nKey.Route,
  [ActivityAuditResourceType.ADAPTER]: RollbackI18nKey.Adapter,
  [ActivityAuditResourceType.TOOLSET]: RollbackI18nKey.Toolsets,
  [ActivityAuditResourceType.INTERCEPTOR_TEMPLATE]: RollbackI18nKey.InterceptorTemplate,
};

export const getRollbackErrorTitle = (
  view: ActivityAuditResourceType,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(RollbackI18nKey.NotificationErrorTitle, { entity: t(rollbackEntityMap[view]) });
};

export const getRollbackErrorDescription = (
  view: ActivityAuditResourceType,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(RollbackI18nKey.NotificationErrorDescription, { entity: t(rollbackEntityMap[view]) });
};

export const getRollbackSuccessTitle = (
  view: ActivityAuditResourceType,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(RollbackI18nKey.NotificationSuccessTitle, { entity: t(rollbackEntityMap[view]) });
};

export const getRollbackSuccessDescription = (
  view: ActivityAuditResourceType,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(RollbackI18nKey.NotificationSuccessDescription, { entity: t(rollbackEntityMap[view]) });
};
