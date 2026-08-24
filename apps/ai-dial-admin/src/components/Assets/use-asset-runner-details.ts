'use client';

import { useEffect, useState } from 'react';

import { getRunner } from '@/src/app/[lang]/assets-app-runners/actions';
import { AppRunnerOption, AppRunnerOrigin } from '@/src/components/SourceField/Application/models';
import { getRunnerOrigin } from '@/src/components/SourceField/Application/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialAppRoute } from '@/src/models/dial/route';
import { resourceRunnerApplicationMap } from './Resources/constants';

/**
 * An asset app runner reaches an application view as a metadata-only option (`buildAppRunnerOptions`
 * never reads per-runner content), so its routes have to be read from the runner resource itself.
 * `routes` stays `null` whenever there is nothing to add — no runner, an admin-BE runner, or a read
 * still in flight — so callers keep falling back to the option's own routes.
 */
export const useAssetRunnerDetails = (runner?: DialApplicationScheme) => {
  const t = useI18n();
  const [routes, setRoutes] = useState<DialAppRoute[] | null>(null);
  const [interceptors, setInterceptors] = useState<string[] | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const path =
    runner && getRunnerOrigin(runner) === AppRunnerOrigin.Asset ? (runner as AppRunnerOption).path : undefined;

  useEffect(() => {
    setRoutes(null);
    setError(null);

    if (!path) {
      setIsLoading(false);
      return;
    }

    let isStale = false;
    setIsLoading(true);

    getRunner(path, DEFAULT_ETAG).then((res) => {
      if (isStale) {
        return;
      }
      setIsLoading(false);
      if (res.success) {
        setRoutes((res.response as DialAppRunnerResource)?.['dial:applicationTypeRoutes'] || []);
        setInterceptors((res.response as DialAppRunnerResource)?.['dial:applicationTypeInterceptors'] || []);
        const result: Record<string, boolean> = Object.fromEntries(
          Object.values(resourceRunnerApplicationMap).map((applicationType) => [
            applicationType,
            res.response?.[applicationType as keyof DialAppRunnerResource] as boolean,
          ]),
        );
        setFeatures(result);
        return;
      }
      // Routes are unknown rather than absent, so the caller must not fall through to "No App Routes".
      setError(res.errorMessage || res.errorHeader || t(EntitiesI18nKey.ResolvedSchemaFailed));
    });

    return () => {
      isStale = true;
    };
  }, [path, t]);

  return { routes, interceptors, features, isLoading, error };
};
