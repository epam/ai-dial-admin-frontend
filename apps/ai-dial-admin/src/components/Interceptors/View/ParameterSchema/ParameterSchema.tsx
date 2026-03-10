import { FC, useEffect, useRef, useState } from 'react';
import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { getConfigurationSchema } from '@/src/app/[lang]/interceptors/actions';
import { useI18n } from '@/src/locales/client';

import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import { RJSFSchema } from '@rjsf/utils';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  schemaURL?: string;
  name: string;
  configuration?: Record<string, unknown>;
  onChangeConfiguration: (data: Record<string, unknown>) => void;
}

const ParameterSchema: FC<Props> = ({ schemaURL, name, configuration, onChangeConfiguration }) => {
  const t = useI18n();
  const getReqRef = useRef(useProtectedRequest());
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (schemaURL) {
      const fetchSchema = async () => {
        setIsLoading(true);
        const schema = (await getReqRef.current(getConfigurationSchema, name)).response;
        if (schema) {
          setIsLoading(false);
          setSchema(schema);
        } else {
          setIsLoading(false);
        }
      };

      fetchSchema().catch((e) => {
        console.error(e);
      });
    }
  }, [name, schemaURL]);

  if (isLoading) {
    return <DialLoader size={40} />;
  }

  return (
    <>
      {!schema ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
      ) : (
        <div className="flex relative min-h-0 size-full">
          <div className="size-full">
            <SchemaUiRenderer schema={schema} data={configuration} onChangeConfiguration={onChangeConfiguration} />
          </div>
        </div>
      )}
    </>
  );
};

export default ParameterSchema;
