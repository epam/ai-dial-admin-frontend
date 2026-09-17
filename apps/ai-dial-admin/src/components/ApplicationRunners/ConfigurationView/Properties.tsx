import { FC, useCallback } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import AppRunnerSource from './AppRunnerSource';
import AppRunnerExtendedProperties from './ExtendedProperties';

interface Props {
  runner: DialApplicationScheme;
  isImmutable?: boolean;
  view?: ApplicationRoute;
  names: string[];
  isModal?: boolean;
  /** Characters the `$id` may not contain. Only the asset surface constrains this — see `CORE_UNENCODABLE_ID_CHARS`. */
  idForbiddenChars?: readonly string[];
  onChangeRunner: (entity: DialApplicationScheme) => void;
}

const SchemeProperties: FC<Props> = ({
  names,
  runner,
  isImmutable,
  idForbiddenChars,
  onChangeRunner,
  isModal,
  view = ApplicationRoute.ApplicationRunners,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
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
          forbiddenChars={idForbiddenChars}
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

      {isImmutable && <AppRunnerExtendedProperties runner={runner} view={view} onChangeRunner={onChangeRunner} />}

      {!isImmutable && (
        <AppRunnerSource
          entity={runner}
          onChangeEntity={onChangeRunner}
          isEntityImmutable={isImmutable}
          isModal={isModal}
          view={ApplicationRoute.ApplicationRunners}
          isReadOnlyAdmin={isReadOnlyAdmin}
        />
      )}
    </div>
  );
};

export default SchemeProperties;
