import { FC, useCallback } from 'react';
import { DialAdapter } from '@/src/models/dial/adapter';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import CompletionEndpointControl from '@/src/components/BaseControls/Endpoint/CompletionEndpoint';

interface Props {
  entity: DialAdapter;
  onChange: (model: DialAdapter) => void;
  prefix?: string;
  isModal?: boolean;
}

const AdapterEndpoint: FC<Props> = ({ entity, onChange, isModal, prefix }) => {
  const onChangeEndpoint = useCallback(
    (baseEndpoint?: string) => {
      onChange({ ...entity, baseEndpoint });
    },
    [onChange, entity],
  );

  return (
    <div className="w-full flex flex-col gap-y-8">
      {prefix ? (
        <CompletionEndpointControl
          endpoint={entity.source?.completionEndpointPath}
          prefix={prefix}
          onChange={(completionEndpointPath) => {
            onChange({
              ...entity,
              source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
            });
          }}
        />
      ) : (
        <CompletionEndpointControl
          isFullWidth={isModal}
          endpoint={entity.baseEndpoint}
          onChange={onChangeEndpoint}
          required={true}
        />
      )}
    </div>
  );
};

export default AdapterEndpoint;
