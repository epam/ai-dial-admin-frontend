import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual } from 'lodash';

import {
  getSessionsSource,
  getSessionsSourceEntities,
  getSessionsSourceSchema,
  saveSessionsSource,
} from '@/src/app/[lang]/system-properties/actions';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { ErrorI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SessionsRole, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { isSessionsSourceComplete, keepRolesInSchema } from '@/src/components/SystemProperties/utils/sessions-source';

const EMPTY_SESSIONS_SOURCE_SETTING: SessionsSourceSetting = {
  baseTable: '',
  roles: {
    [SessionsRole.SessionId]: '',
    [SessionsRole.Time]: '',
    [SessionsRole.Project]: null,
    [SessionsRole.Title]: null,
    [SessionsRole.Cost]: null,
    [SessionsRole.Turns]: null,
  },
};

const readSafely = async <T extends object>(
  read: () => Promise<ServerActionResponse<T>>,
): Promise<ServerActionResponse<T>> => {
  try {
    return await read();
  } catch {
    return { success: false };
  }
};

export const useSessionsSource = (isActive: boolean) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const hasStartedRef = useRef(false);
  const requestedSchemasRef = useRef(new Set<string>());
  const [isLoading, setIsLoading] = useState(true);
  const [isReadFailed, setIsReadFailed] = useState(false);
  const [savedSetting, setSavedSetting] = useState<SessionsSourceSetting | null>(null);
  const [currentSetting, setCurrentSetting] = useState<SessionsSourceSetting>(EMPTY_SESSIONS_SOURCE_SETTING);
  const [tables, setTables] = useState<string[]>([]);
  const [schemas, setSchemas] = useState<Record<string, AnalyticsEntityField[]>>({});

  const notifyFailure = useCallback(
    (title: string, read: ServerActionResponse) => {
      showNotification(getErrorNotification(read.errorHeader ?? title, read.errorMessage, read.requestId));
    },
    [showNotification],
  );

  useEffect(() => {
    if (!isActive || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const load = async () => {
      const [settingRead, entitiesRead] = await Promise.all([
        readSafely(getSessionsSource),
        readSafely(getSessionsSourceEntities),
      ]);

      if (settingRead.success) {
        setSavedSetting(settingRead.response ?? null);
        setCurrentSetting(settingRead.response ?? DEFAULT_SESSIONS_SOURCE_SETTING);
      } else {
        setIsReadFailed(true);
        notifyFailure(t(SystemPropertiesI18nKey.SessionsSourceReadFailed), settingRead);
      }

      if (entitiesRead.success) {
        setTables((entitiesRead.response ?? []).map(({ name }) => name));
      } else {
        notifyFailure(t(SystemPropertiesI18nKey.SessionsSourceTablesReadFailed), entitiesRead);
      }

      setIsLoading(false);
    };

    void load();
  }, [isActive, notifyFailure, t]);

  const loadSchema = useCallback(
    async (table: string): Promise<AnalyticsEntityField[] | null> => {
      requestedSchemasRef.current.add(table);
      const read = await readSafely(() => getSessionsSourceSchema(table));

      if (!read.success) {
        requestedSchemasRef.current.delete(table);
        notifyFailure(t(SystemPropertiesI18nKey.SessionsSourceSchemaReadFailed), read);
        return null;
      }

      const fields = read.response?.fields ?? [];
      setSchemas((prev) => ({ ...prev, [table]: fields }));
      return fields;
    },
    [notifyFailure, t],
  );

  const baseTable = currentSetting.baseTable;

  useEffect(() => {
    if (baseTable && !requestedSchemasRef.current.has(baseTable)) {
      void loadSchema(baseTable);
    }
  }, [baseTable, loadSchema]);

  const initialSetting = useMemo(() => {
    if (savedSetting) {
      return savedSetting;
    }
    return isReadFailed ? EMPTY_SESSIONS_SOURCE_SETTING : DEFAULT_SESSIONS_SOURCE_SETTING;
  }, [isReadFailed, savedSetting]);

  const isChanged = useMemo(() => {
    if (isLoading) {
      return false;
    }
    if (savedSetting) {
      return !isEqual(currentSetting, savedSetting);
    }
    return !isReadFailed || !isEqual(currentSetting, EMPTY_SESSIONS_SOURCE_SETTING);
  }, [currentSetting, isLoading, isReadFailed, savedSetting]);

  const isComplete = isSessionsSourceComplete(currentSetting);

  const tableOptions = useMemo(
    () => (baseTable && !tables.includes(baseTable) ? [baseTable, ...tables] : tables),
    [baseTable, tables],
  );

  const onChangeBaseTable = useCallback(
    async (table: string) => {
      const fields = schemas[table] ?? (await loadSchema(table));

      if (fields == null) {
        return;
      }

      setCurrentSetting((prev) => ({ baseTable: table, roles: keepRolesInSchema(prev.roles, fields) }));
    },
    [loadSchema, schemas],
  );

  const onChangeRole = useCallback((role: SessionsRole, field: string | null) => {
    setCurrentSetting((prev) => ({ ...prev, roles: { ...prev.roles, [role]: field } }));
  }, []);

  const onSave = useCallback(async () => {
    let res: Awaited<ReturnType<typeof saveSessionsSource>>;
    try {
      res = await saveSessionsSource(currentSetting);
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)));
      return;
    }

    if (res.success) {
      const stored = res.response ?? currentSetting;
      setSavedSetting(stored);
      setCurrentSetting(stored);
      setIsReadFailed(false);
      showNotification(getSuccessNotification(t(SystemPropertiesI18nKey.SessionsSourceSaved)));
    } else {
      notifyFailure(t(ErrorI18nKey.Error), res);
    }
  }, [currentSetting, notifyFailure, showNotification, t]);

  const onDiscard = useCallback(() => {
    setCurrentSetting(initialSetting);
  }, [initialSetting]);

  return {
    setting: currentSetting,
    tables: tableOptions,
    fields: schemas[baseTable],
    isLoading,
    isChanged,
    isComplete,
    onChangeBaseTable,
    onChangeRole,
    onSave,
    onDiscard,
  };
};
