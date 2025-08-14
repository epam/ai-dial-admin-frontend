import { useEffect, useState } from 'react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { Container } from '@/src/models/deployments';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import InterceptorEndpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import Containers from '@/src/components/SourceField/Containers/Containers';
import Templates from '@/src/components/SourceField/Template/Templates';
import Field from '@/src/components/Common/Field/Field';
import { DialModel } from '@/src/models/dial/model';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import ModelEndpoint from '@/src/components/SourceField/Endpoints/ModelEndpoint';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getContainers: () => Promise<Container[] | null>;
  getRunners?: () => Promise<InterceptorTemplate[] | null>;
  sourceItems: DropdownItemsModel[];
  elementId: string;
  fieldTitle?: string;
  optional?: boolean;
  view?: ApplicationRoute;
  adapters?: DialAdapter[];
}

const SourceField = <T extends DialInterceptor | DialModel>({
  entity,
  onChange,
  getContainers,
  getRunners,
  elementId,
  fieldTitle,
  optional,
  view,
  adapters,
  sourceItems,
}: Props<T>) => {
  const [source, setSource] = useState(sourceItems[0].id);

  useEffect(() => {
    setSource(entity.source?.$type || sourceItems[0].id);
  }, [entity, sourceItems]);

  return (
    <div className="flex flex-col gap-6 mt-3">
      <div className="flex flex-col max-w-fit">
        <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
        <DropdownField
          items={sourceItems}
          onChange={(source) => {
            setSource(source as SOURCE_TYPE);
            onChange({ ...entity, source: { ...entity.source, $type: source as SOURCE_TYPE } });
          }}
          elementId={elementId}
          selectedValue={source}
        />
      </div>

      {source === SOURCE_TYPE.ENDPOINTS && (
        <>
          {view === ApplicationRoute.Models ? (
            <ModelEndpoint model={entity} adapters={adapters} onChange={onChange as (entity: DialModel) => void} />
          ) : (
            <InterceptorEndpoints entity={entity} onChange={onChange as (entity: DialInterceptor) => void} />
          )}
        </>
      )}
      {source === SOURCE_TYPE.CONTAINER && (
        <Containers
          entity={entity}
          onChange={onChange}
          getContainers={getContainers}
          fieldId={'containers'}
          view={view}
        />
      )}
      {source === SOURCE_TYPE.RUNNER && getRunners && (
        <Templates entity={entity} onChange={onChange} getRunners={getRunners} fieldId={'templates'} />
      )}
    </div>
  );
};

export default SourceField;
