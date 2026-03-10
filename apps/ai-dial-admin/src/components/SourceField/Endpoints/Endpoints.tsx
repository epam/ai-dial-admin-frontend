import { ApplicationRoute } from '@/src/types/routes';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialAdapter } from '@/src/models/dial/adapter';

import ModelEndpoint from '@/src/components/SourceField/Endpoints/ModelEndpoint';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import AdapterEndpoint from '@/src/components/SourceField/Endpoints/AdapterEndpoint';
import InterceptorEndpoint from '@/src/components/SourceField/Endpoints/InterceptorEndpoint';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  view?: ApplicationRoute;
  isModal?: boolean;
  prefix?: string;
}

const Endpoints = <T extends object>({ entity, onChange, view, isModal, prefix }: Props<T>) => {
  return (
    <>
      {view === ApplicationRoute.Models && (
        <ModelEndpoint
          entity={entity}
          onChange={onChange as (entity: DialModel) => void}
          isModal={isModal}
          prefix={prefix}
        />
      )}
      {view === ApplicationRoute.Toolsets && (
        <ToolsetEndpoint
          entity={entity as Toolset}
          disabled={(entity as Toolset).source?.$type === SOURCE_TYPE.CONTAINER}
          onChange={onChange as (entity: Toolset) => void}
          isModal={isModal}
          prefix={prefix}
        />
      )}
      {view === ApplicationRoute.Interceptors && (
        <InterceptorEndpoint
          entity={entity}
          onChange={onChange as (entity: DialInterceptor) => void}
          prefix={prefix}
          isModal={isModal}
        />
      )}
      {view === ApplicationRoute.Adapters && (
        <AdapterEndpoint
          entity={entity}
          onChange={onChange as (entity: DialAdapter) => void}
          prefix={prefix}
          isModal={isModal}
        />
      )}
    </>
  );
};

export default Endpoints;
