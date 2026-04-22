import { ApplicationRoute } from '@/src/types/routes';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication } from '@/src/models/dial/application';

import ModelEndpoint from '@/src/components/SourceField/Endpoints/ModelEndpoint';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import AdapterEndpoint from '@/src/components/SourceField/Endpoints/AdapterEndpoint';
import InterceptorEndpoint from '@/src/components/SourceField/Endpoints/InterceptorEndpoint';
import ApplicationEndpoint from '@/src/components/SourceField/Endpoints/ApplicationEndpoint';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  view?: ApplicationRoute;
  isModal?: boolean;
  isEntityImmutable?: boolean;
  prefix?: string;
  disabled?: boolean;
}

const Endpoints = <T extends object>({
  entity,
  onChange,
  view,
  isModal,
  isEntityImmutable,
  prefix,
  disabled,
}: Props<T>) => {
  const toolsetDisabled = (entity as Toolset).source?.$type === SOURCE_TYPE.CONTAINER || disabled;
  return (
    <>
      {view === ApplicationRoute.Models && (
        <ModelEndpoint
          entity={entity}
          onChange={onChange as (entity: DialModel) => void}
          isModal={isModal}
          prefix={prefix}
          disabled={disabled}
        />
      )}
      {view === ApplicationRoute.Toolsets && (
        <ToolsetEndpoint
          entity={entity as Toolset}
          disabled={toolsetDisabled}
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
          disabled={disabled}
        />
      )}
      {view === ApplicationRoute.Adapters && (
        <AdapterEndpoint
          entity={entity}
          onChange={onChange as (entity: DialAdapter) => void}
          prefix={prefix}
          isModal={isModal}
          disabled={disabled}
        />
      )}
      {view === ApplicationRoute.Applications && (
        <ApplicationEndpoint
          entity={entity as DialApplication}
          onChange={onChange as (entity: DialApplication) => void}
          isEntityImmutable={isEntityImmutable}
          isModal={isModal}
          disabled={disabled}
        />
      )}
    </>
  );
};

export default Endpoints;
