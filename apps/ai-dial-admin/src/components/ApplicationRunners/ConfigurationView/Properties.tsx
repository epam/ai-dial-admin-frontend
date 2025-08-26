import { FC, useCallback } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { DialApplicationScheme } from '@/src/models/dial/application';
import AppRunnerExtendedProperties from './ExtendedProperties';

interface Props {
  runner: DialApplicationScheme;
  isImmutable?: boolean;
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const SchemeProperties: FC<Props> = ({ runner, isImmutable, onChangeRunner }) => {
  const onChangeId = useCallback(
    (id?: string) => {
      onChangeRunner({
        ...runner,
        $id: id,
      });
    },
    [onChangeRunner, runner],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      onChangeRunner({ ...runner, 'dial:applicationTypeDisplayName': name });
    },
    [runner, onChangeRunner],
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {!isImmutable && <IdControl entity={{ name: runner.$id }} onChangeEntity={(entity) => onChangeId(entity.name)} />}

      <DisplayNameControl displayName={runner['dial:applicationTypeDisplayName']} onChange={onChangeName} />

      <DescriptionControl entity={runner} onChangeEntity={onChangeRunner} />

      {isImmutable && <AppRunnerExtendedProperties runner={runner} onChangeRunner={onChangeRunner} />}
    </div>
  );
};

export default SchemeProperties;
