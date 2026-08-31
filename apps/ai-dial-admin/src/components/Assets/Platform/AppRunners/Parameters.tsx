'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialLoader, DialNoDataContent, JsonSchema } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import SchemaGrid from '@/src/components/Common/SchemaGrid/SchemaGrid';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { AppRunnerAssetProps } from './models';

interface Props extends AppRunnerAssetProps {
  isSkipRefresh?: boolean;
}

/**
 * A runner that declares `dial:applicationTypeSchemaEndpoint` has its parameters owned by that remote
 * endpoint, so they are read-only and must come from Core's resolved read (which performs the
 * download and merge). Without that field there is nothing to resolve and the runner's own
 * `properties` are edited directly — mirroring how the admin BE derives `isReadOnly`.
 */
const AppRunnerAssetParameters: FC<Props> = ({ runner, onChange, isSkipRefresh }) => {
  const t = useI18n();
  const runnerRef = useRef(runner);
  runnerRef.current = runner;

  const isReadonly = !!runner['dial:applicationTypeSchemaEndpoint'];
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedSchema, setResolvedSchema] = useState<JsonSchema | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const onChangeSchema = useCallback(
    (schema: JSONSchema7, skipRefresh?: boolean) => {
      const current = runnerRef.current;
      if (!current) return;
      const merged = { ...current, ...(schema as unknown as DialAppRunnerResource) };
      if (!('required' in (schema as object))) {
        delete merged.required;
      }
      onChange(merged, skipRefresh);
    },
    [onChange],
  );

  useEffect(() => {
    if (!isReadonly || !runner.$id) {
      setResolvedSchema(null);
      setResolveError(null);
      return;
    }
    setIsLoading(true);
    getResolvedRunnerSchema(runner.$id).then((res) => {
      setIsLoading(false);
      if (res.success && res.response) {
        setResolvedSchema(res.response as JsonSchema);
        setResolveError(null);
        return;
      }
      // Core owns the download of `dial:applicationTypeSchemaEndpoint`; a failure means the
      // parameters are genuinely unknown, which must not be shown as "no parameters".
      setResolvedSchema(null);
      setResolveError(res.errorMessage || res.errorHeader || t(EntitiesI18nKey.ResolvedSchemaFailed));
    });
  }, [isReadonly, runner.$id, t]);

  const schema = isReadonly ? resolvedSchema : (runner as unknown as JsonSchema);

  const isNoData = useMemo(() => !schema?.properties || !Object.keys(schema.properties).length, [schema]);

  if (isLoading) {
    return (
      <div className="flex flex-col size-full">
        <DialLoader size={40} />
      </div>
    );
  }

  if (resolveError) {
    return (
      <div className="flex flex-col size-full">
        <DialNoDataContent title={t(EntitiesI18nKey.ResolvedSchemaFailed)} description={resolveError} />
      </div>
    );
  }

  return (
    <div className="flex flex-col size-full">
      {isNoData ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
      ) : (
        <SchemaGrid
          schema={schema as JSONSchema7}
          onChange={onChangeSchema}
          isSkipRefresh={isSkipRefresh}
          isReadonly={isReadonly}
          isDialSchema
        />
      )}
    </div>
  );
};

export default AppRunnerAssetParameters;
