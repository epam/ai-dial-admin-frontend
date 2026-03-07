'use client';

import { FC, useCallback, useRef } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { RJSFSchema } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';

import SchemaGrid from '@/src/components/Common/SchemaGrid/SchemaGrid';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  runner?: DialApplicationScheme;
  onChangeRunner: (runner: DialApplicationScheme, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const Parameters: FC<Props> = ({ runner, onChangeRunner, isSkipRefresh }) => {
  const t = useI18n();
  const runnerRef = useRef(runner);
  runnerRef.current = runner;

  const onChangeSchema = useCallback(
    (schema: RJSFSchema, skipRefresh?: boolean) => {
      delete schema.type;
      const current = runnerRef.current;
      if (!current) return;
      onChangeRunner({ ...current, ...(schema as unknown as DialApplicationScheme) }, skipRefresh);
    },
    [onChangeRunner],
  );

  return (
    <div className="flex flex-col size-full">
      {!runner || !runner?.properties || !Object.keys(runner.properties || {}).length ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
      ) : (
        <SchemaGrid
          schema={runner as JSONSchema7}
          onChange={onChangeSchema}
          isSkipRefresh={isSkipRefresh}
          isDialSchema={true}
        />
      )}
    </div>
  );
};

export default Parameters;
