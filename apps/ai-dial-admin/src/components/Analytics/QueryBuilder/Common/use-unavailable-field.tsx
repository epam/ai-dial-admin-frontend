'use client';

import { useMemo } from 'react';

import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { unresolvedFieldNames } from '@/src/components/Analytics/QueryBuilder/utils/unavailable-fields';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface UnavailableField {
  isUnavailable: (name: string) => boolean;
  // The one wording every section uses. Identical whether the column was dropped from the catalog or
  // is not visible to this caller — a fork here would disclose which columns exist.
  hintFor: (name: string) => string | undefined;
}

// Derived from the state rather than carried on the context: every section resolves the same names
// from the same pure function, so no provider can hand a section a set that disagrees with its query.
export const useUnavailableField = (): UnavailableField => {
  const t = useI18n();
  const { state } = useQueryBuilder();

  const unresolvedFields = useMemo(() => new Set(unresolvedFieldNames(state)), [state]);

  const isUnavailable = (name: string) => !!name && unresolvedFields.has(name);

  return {
    isUnavailable,
    hintFor: (name: string) =>
      isUnavailable(name)
        ? t(QueryBuilderI18nKey.UnavailableFieldChip, { field: name, source: state.entityName })
        : undefined,
  };
};
