import { FC, useEffect, useRef, useState } from 'react';
import { DialLoader, DialNoDataContent, JsonSchema } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { getConfigurationSchema } from '@/src/app/[lang]/interceptors/actions';
import { useI18n } from '@/src/locales/client';

import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ServerActionResponse } from '@/src/models/server-action';

interface Props {
  schemaURL?: string;
  name: string;
  configuration?: Record<string, unknown>;
  onChangeConfiguration: (data: Record<string, unknown>) => void;
  /**
   * Defaults to the admin-BE lookup by name (`interceptorsApi.getConfigurationSchema`), which only
   * resolves an admin-BE-tracked entity. Core-direct surfaces override this with a fetch against
   * Core's own `v1/deployments/{name}/configuration` (see `assets-interceptors/actions.ts`'s
   * `getInterceptorConfigurationSchema`), so this component stays shared rather than forked.
   */
  getSchema?: (name: string) => Promise<ServerActionResponse<JsonSchema>>;
}

const ParameterSchema: FC<Props> = ({
  schemaURL,
  name,
  configuration,
  onChangeConfiguration,
  getSchema = getConfigurationSchema,
}) => {
  const t = useI18n();
  const getReqRef = useRef(useProtectedRequest());
  const [schema, setSchema] = useState<JsonSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (schemaURL) {
      const fetchSchema = async () => {
        setIsLoading(true);
        const schema = (await getReqRef.current(getSchema, name)).response;
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
  }, [name, schemaURL, getSchema]);

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
