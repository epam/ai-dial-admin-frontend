import { QueriesI18nKey } from '@/src/constants/i18n';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryEditor, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';

export const DEFAULT_SAVED_QUERY_SCOPE = SavedQueryScope.Personal;

export const DEFAULT_SAVED_QUERY_RESULT_VIEW = QueryResultView.Table;

export const SAVED_QUERY_SCOPES: SavedQueryScope[] = [SavedQueryScope.Personal, SavedQueryScope.Common];

export const KNOWN_TIME_PERIODS: string[] = timePeriodOptionsConfig.map((option) => option.value);

export const SAVED_QUERY_EDITOR_I18N_KEYS: Record<SavedQueryEditor, QueriesI18nKey> = {
  [SavedQueryEditor.Builder]: QueriesI18nKey.EditorBuilder,
  [SavedQueryEditor.Json]: QueriesI18nKey.EditorJson,
  [SavedQueryEditor.Sql]: QueriesI18nKey.EditorSql,
};
