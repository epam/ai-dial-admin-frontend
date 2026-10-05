'use client';

import { useEffect, useState } from 'react';

import { getConfigFileAppRunner, getRunner } from '@/src/app/[lang]/platform-app-runners/actions';
import { AppRunnerOption, AppRunnerOrigin } from '@/src/components/SourceField/Application/models';
import { getRunnerOrigin } from '@/src/components/SourceField/Application/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ObjectAppRoutes } from '@/src/components/Assets/ObjectAppRoutes/models';
import { resourceRunnerApplicationMap } from '@/src/components/Assets/Resources/constants';

/**
 * An asset app runner reaches an application view as a metadata-only option (`buildAppRunnerOptions`
 * never reads per-runner content), so its routes have to be read from the runner resource itself.
 * `routes` stays `null` whenever there is nothing to add — no runner, an admin-BE runner, or a read
 * still in flight — so callers keep falling back to the option's own routes.
 */
export const useAssetRunnerDetails = (runner?: DialApplicationScheme) => {
  const t = useI18n();
  const [routes, setRoutes] = useState<ObjectAppRoutes | null>(null);
  const [interceptors, setInterceptors] = useState<string[] | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = runner ? getRunnerOrigin(runner) : undefined;
  const path = origin === AppRunnerOrigin.Platform ? (runner as AppRunnerOption).path : undefined;
  const configFileRunnerId = origin === AppRunnerOrigin.Config ? runner?.$id || runner?.name : undefined;

  useEffect(() => {
    setRoutes(null);
    setInterceptors(null);
    setFeatures(null);
    setError(null);

    if (!path && !configFileRunnerId) {
      setIsLoading(false);
      return;
    }

    let isStale = false;
    setIsLoading(true);

    const loadRunnerDetails = async () => {
      try {
        let details: DialAppRunnerResource | undefined;

        if (origin === AppRunnerOrigin.Platform) {
          const res = await getRunner(path as string, DEFAULT_ETAG);
          if (isStale) {
            return;
          }
          setIsLoading(false);
          if (!res.success) {
            // Routes are unknown rather than absent, so the caller must not fall through to "No App Routes".
            setError(res.errorMessage || res.errorHeader || t(EntitiesI18nKey.ResolvedSchemaFailed));
            return;
          }
          details = res.response as DialAppRunnerResource;
        } else {
          const res = await getConfigFileAppRunner(configFileRunnerId as string);
          if (isStale) {
            return;
          }
          setIsLoading(false);
          if (!res.success) {
            setError(res.failure.errorMessage || res.failure.errorHeader || t(EntitiesI18nKey.ResolvedSchemaFailed));
            return;
          }
          details = res.data as DialAppRunnerResource;
        }
        setRoutes((details?.['dial:applicationTypeRoutes'] as ObjectAppRoutes | undefined) || null);
        setInterceptors(details?.['dial:applicationTypeInterceptors'] || []);
        const result: Record<string, boolean> = Object.fromEntries(
          Object.values(resourceRunnerApplicationMap).map((applicationType) => [
            applicationType,
            details?.[applicationType as keyof DialAppRunnerResource] as boolean,
          ]),
        );
        setFeatures(result);
      } catch {
        if (!isStale) {
          setIsLoading(false);
          setError(t(EntitiesI18nKey.ResolvedSchemaFailed));
        }
      }
    };

    void loadRunnerDetails();

    return () => {
      isStale = true;
    };
  }, [configFileRunnerId, origin, path, t]);

  return { routes, interceptors, features, isLoading, error };
};
