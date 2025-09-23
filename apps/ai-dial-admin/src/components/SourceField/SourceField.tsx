import { useCallback, useEffect, useState } from 'react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { Container } from '@/src/models/deployments';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import { ServerActionResponse } from '@/src/models/server-action';
import { Toolset } from '@/src/models/dial/toolset';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { isValidSourceField } from '@/src/components/SourceField/utils';
import { getEndpointPostfix } from '@/src/components/ModelView/ModelProperties/utils';

import Field from '@/src/components/Common/Field/Field';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import Containers from '@/src/components/SourceField/Containers/Containers';
import Templates from '@/src/components/SourceField/Template/Templates';
import Adapters from '@/src/components/SourceField/Adapters/Adapters';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getContainers: () => Promise<Container[] | null>;
  getRunners?: () => Promise<InterceptorTemplate[] | null>;
  getAdapters?: () => Promise<ServerActionResponse | null>;
  sourceItems: DropdownItemsModel[];
  elementId: string;
  fieldTitle?: string;
  optional?: boolean;
  view?: ApplicationRoute;
  adapters?: DialAdapter[];
  isModal?: boolean;
}

const SourceField = <T extends DialInterceptor | DialModel | Toolset>({
  entity,
  onChange,
  getContainers,
  getRunners,
  getAdapters,
  elementId,
  fieldTitle,
  optional,
  view,
  sourceItems,
  isModal,
}: Props<T>) => {
  const { dispatch } = useSaveValidationContext();
  const [source, setSource] = useState(sourceItems[0].id);

  const onChangeEntity = useCallback(
    (entity: T) => {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'source',
        isValid: isValidSourceField(entity),
      });
      onChange(entity);
    },
    [dispatch, onChange],
  );

  const onChangeSource = useCallback(
    (sourceType: string) => {
      if (sourceType !== source) {
        setSource(sourceType as SOURCE_TYPE);
        onChangeEntity({ ...entity, source: { ...entity.source, $type: sourceType as SOURCE_TYPE }, endpoint: null });
      }
    },
    [entity, onChangeEntity, source],
  );

  useEffect(() => {
    if (!entity.source) {
      onChangeEntity({
        ...entity,
        source: {
          $type: sourceItems[0].id,
          completionEndpointPath: view === ApplicationRoute.Models ? getEndpointPostfix(DialModelType.Chat) : '',
        },
      });
    } else {
      setSource(entity.source.$type);
    }
  }, [entity, onChangeEntity, sourceItems, view]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col max-w-fit">
        <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
        <DropdownField
          listClassName={'w-fit'}
          items={sourceItems}
          onChange={onChangeSource}
          elementId={elementId}
          selectedValue={source}
        />
      </div>

      {source === SOURCE_TYPE.ENDPOINTS && (
        <Endpoints entity={entity} onChange={onChangeEntity} view={view} isModal={isModal} />
      )}
      {source === SOURCE_TYPE.CONTAINER && (
        <Containers
          entity={entity}
          onChange={onChangeEntity}
          getContainers={getContainers}
          view={view}
          isModal={isModal}
        />
      )}
      {source === SOURCE_TYPE.RUNNER && getRunners && (
        <Templates entity={entity} onChange={onChangeEntity} getRunners={getRunners} />
      )}
      {source === SOURCE_TYPE.ADAPTER && getAdapters && (
        <Adapters entity={entity} onChange={onChangeEntity} getAdapters={getAdapters} isModal={isModal} />
      )}
    </div>
  );
};

export default SourceField;
