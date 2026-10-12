import { MarkedPrivilege } from '@/src/components/Analytics/Tables/access/models';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { TableGrantKey } from '@/src/models/analytics/table';

export const ALL_GRANT_KEYS: TableGrantKey[] = [
  TableGrantKey.Get,
  TableGrantKey.Read,
  TableGrantKey.Sensitive,
  TableGrantKey.Write,
  TableGrantKey.Modify,
];

export const MARKED_PRIVILEGES: Array<{ key: MarkedPrivilege; label: AnalyticsTableAccessI18nKey }> = [
  { key: TableGrantKey.Get, label: AnalyticsTableAccessI18nKey.ColGet },
  { key: TableGrantKey.Read, label: AnalyticsTableAccessI18nKey.ColRead },
  { key: TableGrantKey.Write, label: AnalyticsTableAccessI18nKey.ColWrite },
  { key: TableGrantKey.Modify, label: AnalyticsTableAccessI18nKey.ColModify },
];

// The service answers 409 table_is_system to a write or modify grant on a system table.
export const SYSTEM_LOCKED_PRIVILEGES: MarkedPrivilege[] = [TableGrantKey.Write, TableGrantKey.Modify];
