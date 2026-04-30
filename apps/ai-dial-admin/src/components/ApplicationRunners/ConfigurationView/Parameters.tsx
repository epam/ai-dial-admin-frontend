'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialLoader, DialNoDataContent, JsonSchema } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import SchemaGrid from '@/src/components/Common/SchemaGrid/SchemaGrid';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';

interface Props {
  runner?: DialApplicationScheme;
  onChangeRunner: (runner: DialApplicationScheme, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const Parameters: FC<Props> = ({ runner, onChangeRunner, isSkipRefresh }) => {
  const t = useI18n();
  const runnerRef = useRef(runner);
  runnerRef.current = runner;

  const [isLoading, setIsLoading] = useState(false);
  const [isReadonly, setIsReadonly] = useState(false);

  const [resolvedSchema, setResolvedSchema] = useState<JsonSchema | null>(null);

  const onChangeSchema = useCallback(
    (schema: JSONSchema7, skipRefresh?: boolean) => {
      const current = runnerRef.current;
      if (!current) return;
      const merged = { ...current, ...(schema as unknown as DialApplicationScheme) };
      if (!('required' in (schema as object))) {
        delete merged.required;
      }
      onChangeRunner(merged, skipRefresh);
    },
    [onChangeRunner],
  );

  useEffect(() => {
    const id = runner?.$id;
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getResolvedApplicationScheme(id).then((res) => {
      setIsLoading(false);
      if (res.success && res.response) {
        const isReadOnly = res.response.isReadOnly;
        setIsReadonly(isReadOnly);
        setResolvedSchema(isReadOnly ? res.response.schema : null);
      } else {
        setIsReadonly(false);
        setResolvedSchema(runner as JsonSchema);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runner?.$id]);

  const isNoData = useMemo(() => {
    return isReadonly
      ? !resolvedSchema || !resolvedSchema?.properties || !Object.keys(resolvedSchema.properties || {}).length
      : !runner || !runner?.properties || !Object.keys(runner.properties || {}).length;
  }, [isReadonly, resolvedSchema, runner]);

  return (
    <div className="flex flex-col size-full">
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <>
          {isNoData ? (
            <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
          ) : (
            <SchemaGrid
              schema={(resolvedSchema || runner) as JSONSchema7}
              onChange={onChangeSchema}
              isSkipRefresh={isSkipRefresh}
              isReadonly={isReadonly}
              isDialSchema
            />
          )}
        </>
      )}
    </div>
  );
};

export default Parameters;
