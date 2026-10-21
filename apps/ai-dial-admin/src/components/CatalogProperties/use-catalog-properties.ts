'use client';

import { useEffect, useMemo, useState } from 'react';

import { getCatalogSchemaById } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { CatalogSchemaDocument } from '@/src/models/dial/catalog-schema';
import { validateCatalogProperties } from '@/src/utils/catalog-schemas/validate-properties';
import { CatalogSchemaValidationError } from '@/src/utils/catalog-schemas/validation';

export interface CatalogPropertiesState {
  schema?: CatalogSchemaDocument;
  isLoading: boolean;
  hasReadFailed: boolean;
  errors: CatalogSchemaValidationError[];
}

const VALIDATION_FIELD = 'catalogProperties';

/**
 * Resolves the selected schema and reports the values' validity to the shared save-validation
 * context, which every surface's header already consumes.
 *
 * Called from each surface's `TabsContent` rather than from the values editor, because the editor
 * renders only while its own tab is active: a deployment whose stored values are invalid, or whose
 * schema is switched on the Properties tab, would otherwise never be validated and Core would take
 * the write — for a platform-bucket resource, breaking the whole merged configuration at assembly.
 */
export const useCatalogProperties = (schemaId?: string, values?: Record<string, unknown>): CatalogPropertiesState => {
  const { dispatch } = useSaveValidationContext();

  const [schema, setSchema] = useState<CatalogSchemaDocument | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReadFailed, setHasReadFailed] = useState(false);

  useEffect(() => {
    if (!schemaId) {
      setSchema(undefined);
      setHasReadFailed(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    getCatalogSchemaById(schemaId)
      .then((result) => {
        if (!isCurrent) return;
        setSchema(result.success ? (result.response as CatalogSchemaDocument) : undefined);
        setHasReadFailed(!result.success);
      })
      // A thrown read is the same outcome as a rejected one for this surface, and must not escape as
      // an unhandled rejection — the editor reports it and the save stays unblocked.
      .catch(() => {
        if (!isCurrent) return;
        setSchema(undefined);
        setHasReadFailed(true);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [schemaId]);

  const errors = useMemo(() => validateCatalogProperties(schema, values), [schema, values]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: VALIDATION_FIELD, isValid: !errors.length });
  }, [dispatch, errors]);

  return { schema, isLoading, hasReadFailed, errors };
};
