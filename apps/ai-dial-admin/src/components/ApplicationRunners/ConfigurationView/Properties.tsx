import { FC, useCallback } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import CompletionEndpointControl from '@/src/components/BaseControls/Endpoint/CompletionEndpoint';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { DialApplicationScheme } from '@/src/models/dial/application';
import AppRunnerExtendedProperties from './ExtendedProperties';

interface Props {
  runner: DialApplicationScheme;
  isImmutable?: boolean;
  names: string[];
  isModal?: boolean;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const SchemeProperties: FC<Props> = ({ names, runner, isImmutable, onChangeRunner, isModal }) => {
  const onChangeId = useCallback(
    (id?: string) => {
      onChangeRunner({
        ...runner,
        $id: id,
      });
    },
    [onChangeRunner, runner],
  );

  return (
    <div className="flex flex-col gap-y-8 h-full">
      {!isImmutable && (
        <IdControl
          names={names}
          isUrlId
          entity={{ name: runner.$id }}
          onChangeEntity={(entity) => onChangeId(entity.name)}
        />
      )}

      <DisplayNameControl
        displayName={runner['dial:applicationTypeDisplayName']}
        required
        isFullWidth={!isImmutable}
        onChange={(name?: string) => onChangeRunner({ ...runner, 'dial:applicationTypeDisplayName': name })}
      />

      <DescriptionControl entity={runner} onChangeEntity={onChangeRunner} isFullWidth={!isImmutable} />

      {isImmutable && <AppRunnerExtendedProperties runner={runner} onChangeRunner={onChangeRunner} />}

      {!isImmutable && (
        <CompletionEndpointControl
          endpoint={runner['dial:applicationTypeCompletionEndpoint']}
          onChange={(endpoint?: string) =>
            onChangeRunner({ ...runner, 'dial:applicationTypeCompletionEndpoint': endpoint })
          }
          required
          isFullWidth
          isModal={isModal}
        />
      )}
    </div>
  );
};

export default SchemeProperties;
