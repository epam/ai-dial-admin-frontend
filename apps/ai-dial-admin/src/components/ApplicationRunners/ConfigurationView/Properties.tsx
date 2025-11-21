import { FC, useCallback } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { DialApplicationScheme } from '@/src/models/dial/application';
import AppRunnerExtendedProperties from './ExtendedProperties';

interface Props {
  runner: DialApplicationScheme;
  isImmutable?: boolean;
  names: string[];
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const SchemeProperties: FC<Props> = ({ names, runner, isImmutable, onChangeRunner }) => {
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
    <div className="flex flex-col gap-6 h-full">
      {!isImmutable && (
        <IdControl
          names={names}
          isUrlId={true}
          entity={{ name: runner.$id }}
          onChangeEntity={(entity) => onChangeId(entity.name)}
        />
      )}

      <DisplayNameControl
        displayName={runner['dial:applicationTypeDisplayName']}
        required={true}
        onChange={(name?: string) => onChangeRunner({ ...runner, 'dial:applicationTypeDisplayName': name })}
      />

      <DescriptionControl entity={runner} onChangeEntity={onChangeRunner} />

      {isImmutable && <AppRunnerExtendedProperties runner={runner} onChangeRunner={onChangeRunner} />}

      {!isImmutable && (
        <CompletionEndpointControl
          endpoint={runner['dial:applicationTypeCompletionEndpoint']}
          onChange={(endpoint?: string) =>
            onChangeRunner({ ...runner, 'dial:applicationTypeCompletionEndpoint': endpoint })
          }
          required={true}
        />
      )}
    </div>
  );
};

export default SchemeProperties;
