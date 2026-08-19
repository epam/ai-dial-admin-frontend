import { useCallback } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { UpstreamEndpointsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialModelEndpoint } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import Endpoint from './Endpoint/Endpoint';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  onChangeEntity: (entity: T) => void;
  isKeyOptional?: boolean;
  required?: boolean;
  view?: ApplicationRoute;
  withResponses?: boolean;
  collapsible?: boolean;
}

const UpstreamEndpoints = <T extends { upstreams?: DialModelEndpoint[] }>({
  disabled,
  entity,
  onChangeEntity,
  isKeyOptional,
  required,
  view,
  withResponses,
  collapsible = true,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;

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

  const count = entity.upstreams?.length ?? 0;
  // Always render the same array shape (real upstreams, or a single placeholder) so switching
  // from 0 to 1 upstream never changes the JSX structure — that structural switch is what was
  // remounting the input and dropping focus after the first keystroke.
  const upstreams = count > 0 ? entity.upstreams! : [{}];

  return (
    <Accordion
      title={`${t(UpstreamEndpointsI18nKey.Endpoints)}: ${count}`}
      contentClassName="gap-4 lg:gap-2"
      collapsible={collapsible}
      collapsed={collapsible ? true : false}
    >
      {upstreams.map((endpoint, index) => (
        <Endpoint
          disabled={isDisabled}
          key={index}
          endpoint={endpoint}
          index={index}
          isKeyOptional={isKeyOptional}
          required={required}
          updateEndpoint={(point) => onUpdateEndPoint(point, index)}
          removeEndpoint={onRemoveEndpoint}
          view={view}
          withResponses={withResponses}
        />
      ))}
      {!isDisabled && (
        <div>
          <DialGhostButton
            label={t(UpstreamEndpointsI18nKey.AddUpstream)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAddEndpoint}
          />
        </div>
      )}
    </Accordion>
  );
};

export default UpstreamEndpoints;
