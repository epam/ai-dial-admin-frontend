'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset } from '@/src/models/dial/toolset';

import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';

interface Props {
  entity: Toolset;
  onChange: (toolset: Toolset) => void;
  prefix?: string;
  isModal?: boolean;
}

const ToolsetEndpoint: FC<Props> = ({ entity, onChange, prefix, isModal }) => {
  const t = useI18n();

  return (
    <div className={classNames(!isModal && 'lg:w-[35%]')}>
      {prefix ? (
        <EndpointControl
          id="endpoint"
          required={true}
          textBeforeInput={prefix}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          endpoint={entity.source?.completionEndpointPath}
          onChange={(completionEndpointPath) =>
            onChange({
              ...entity,
              source: { ...entity.source, completionEndpointPath } as SOURCE_FIELD,
            })
          }
        />
      ) : (
        <EndpointControl
          id="endpoint"
          required={true}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntitiesI18nKey.ExternalEndpoint)}
          endpoint={entity.endpoint}
          onChange={(endpoint) => onChange({ ...entity, endpoint })}
        />
      )}
    </div>
  );
};

export default ToolsetEndpoint;
