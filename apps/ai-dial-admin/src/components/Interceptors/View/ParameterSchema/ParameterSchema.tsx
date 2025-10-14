import { FC, useCallback, useEffect, useState } from 'react';
import { DialLoader, DialNoDataContent, DialSwitch } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { getConfigurationSchema } from '@/src/app/[lang]/interceptors/actions';
import { useI18n } from '@/src/locales/client';

import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import JsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';

interface Props {
  schemaURL?: string;
  name: string;
  configuration?: Record<string, unknown>;
  onChangeConfiguration: (data: Record<string, unknown>) => void;
}

const ParameterSchema: FC<Props> = ({ schemaURL, name, configuration, onChangeConfiguration }) => {
  const t = useI18n();
  const [schema, setSchema] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState(false);

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, []);

  useEffect(() => {
    if (schemaURL) {
      const fetchSchema = async () => {
        setIsLoading(true);
        const schema = await getConfigurationSchema(name);
        if (schema) {
          setIsLoading(false);
          setSchema(schema);
        }
      };

      fetchSchema().catch((e) => {
        console.error(e);
      });
    } else {
      setIsLoading(false);
      setSchema({
        $defs: {
          DeIdentificationConfig: {
            additionalProperties: {
              type: 'string',
            },
            properties: {
              info_types: {
                default: ['PHONE_NUMBER', 'FIRST_NAME', 'LAST_NAME'],
                items: {
                  type: 'string',
                },
                title: 'Info Types',
                type: 'array',
              },
            },
            title: 'DeIdentificationConfig',
            type: 'object',
          },
        },
        additionalProperties: {
          type: 'string',
        },
        properties: {
          deidentification_config: {
            allOf: [
              {
                $ref: '#/$defs/DeIdentificationConfig',
              },
            ],
            default: {
              info_types: ['PHONE_NUMBER', 'FIRST_NAME', 'LAST_NAME'],
            },
          },
        },
        title: 'GoogleDLPAnonymizerConfig',
        type: 'object',
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
        <div className="flex relative min-h-0 h-full w-full">
          <div className="w-full h-full">
            {jsonEditorEnabled ? (
              <JsonEditor
                entity={schema}
                setSelectedEntity={() => {
                  /* TODO: support editing schema */
                }}
              />
            ) : (
              <SchemaUiRenderer schema={schema} data={configuration} onChangeConfiguration={onChangeConfiguration} />
            )}
          </div>
          <div className="absolute right-2 top-2 z-400111">
            <DialSwitch
              isOn={jsonEditorEnabled}
              title={t(EntitiesI18nKey.JSONViewer)}
              switchId="jsonEditorScheme"
              onChange={toggleJsonEditor}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ParameterSchema;
