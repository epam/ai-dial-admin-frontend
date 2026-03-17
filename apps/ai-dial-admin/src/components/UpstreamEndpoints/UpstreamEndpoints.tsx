import { FC, useCallback } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { DialNeutralButton } from '@epam/ai-dial-ui-kit';

import { UpstreamEndpointsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { DialModel, DialModelEndpoint } from '@/src/models/dial/model';
import { DialRoute } from '@/src/models/dial/route';
import Endpoint from './Endpoint/Endpoint';

interface Props {
  entity: DialRoute | DialModel;
  disabled?: boolean;
  onChangeEntity: (entity: DialRoute | DialModel) => void;
  isKeyOptional?: boolean;
  required?: boolean;
}

const UpstreamEndpoints: FC<Props> = ({ disabled, entity, onChangeEntity, isKeyOptional, required }) => {
  const t = useI18n();

  const onAddEndpoint = useCallback(() => {
    const upstreams = [...(entity.upstreams || []), {}];
    onChangeEntity({ ...entity, upstreams: upstreams.length === 1 ? [...upstreams, {}] : upstreams });
  }, [onChangeEntity, entity]);

  const onUpdateEndPoint = useCallback(
    (point: DialModelEndpoint, index: number) => {
      const updatedUpstreams = [...(entity.upstreams || [])];
      updatedUpstreams[index] = point;

      onChangeEntity({ ...entity, upstreams: [...(updatedUpstreams || [])] });
    },
    [onChangeEntity, entity],
  );

  const onRemoveEndpoint = useCallback(
    (index: number) => {
      if (entity.upstreams) {
        if (entity.upstreams.length === 1) {
          entity.upstreams = [];
        } else {
          entity.upstreams.splice(index, 1);
        }
      }
      onChangeEntity({ ...entity, upstreams: [...(entity.upstreams || [])] });
    },
    [onChangeEntity, entity],
  );

  return (
    <div className="flex flex-col gap-y-4 lg:gap-y-2">
      <div className="flex flex-col gap-4 lg:gap-2">
        {entity.upstreams == null || entity.upstreams.length === 0 ? (
          <Endpoint
            key={0}
            disabled={disabled}
            endpoint={{}}
            index={0}
            isKeyOptional={isKeyOptional}
            required={required}
            updateEndpoint={(point) => onUpdateEndPoint(point, 0)}
            removeEndpoint={onRemoveEndpoint}
          />
        ) : (
          entity.upstreams?.map((endpoint, index) => (
            <Endpoint
              disabled={disabled}
              key={index}
              endpoint={endpoint}
              index={index}
              isKeyOptional={isKeyOptional}
              required={required}
              updateEndpoint={(point) => onUpdateEndPoint(point, index)}
              removeEndpoint={onRemoveEndpoint}
            />
          ))
        )}
      </div>
      {!disabled && (
        <div>
          <DialNeutralButton
            label={t(UpstreamEndpointsI18nKey.AddUpstream)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAddEndpoint}
          />
        </div>
      )}
    </div>
  );
};

export default UpstreamEndpoints;
