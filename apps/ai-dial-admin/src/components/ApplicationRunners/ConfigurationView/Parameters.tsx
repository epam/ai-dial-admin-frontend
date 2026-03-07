'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { RJSFSchema } from '@rjsf/utils';

import SchemaGrid from '@/src/components/Common/SchemaGrid/SchemaGrid';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  runner?: DialApplicationScheme;
  onChangeRunner: (runner: DialApplicationScheme) => void;
  isSkipRefresh?: boolean;
}

const Parameters: FC<Props> = ({ runner, onChangeRunner, isSkipRefresh }) => {
  const t = useI18n();
  const rjsfSchema = useMemo(
    () =>
      ({
        $defs: runner?.$defs,
        properties: runner?.properties,
        required: runner?.required,
        type: 'object',
      }) as RJSFSchema,
    [runner?.$defs, runner?.properties, runner?.required],
  );

  const onChangeSchema = useCallback(
    (schema: RJSFSchema) => {
      delete schema.type;
      onChangeRunner({ ...runner, ...(schema as unknown as DialApplicationScheme) });
    },
    [runner, onChangeRunner],
  );

  return (
    <div className="flex flex-col size-full">
      {!runner || !runner?.properties || !Object.keys(runner.properties || {}).length ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
      ) : (
        <SchemaGrid schema={rjsfSchema} onChange={onChangeSchema} isSkipRefresh={isSkipRefresh} />
      )}
    </div>
  );
};

export default Parameters;
