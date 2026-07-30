import { FC } from 'react';

import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/app-runners/constants';

interface Props {
  entity: DialAppRunnerResource;
  names: string[];
  isModal?: boolean;
  onChangeEntity: (entity: object) => void;
}

/**
 * Create-modal body for an app-runner asset. Reuses the entity-side runner properties so the `$id`
 * URL validation and the required display name behave identically on both surfaces; `AssetProperties`
 * is bypassed because it renders a version field, which this flat unversioned type has no use for.
 */
const AppRunnerCreateProperties: FC<Props> = ({ entity, names, isModal, onChangeEntity }) => {
  return (
    <SchemeProperties
      names={names}
      runner={entity}
      isModal={isModal}
      idForbiddenChars={CORE_UNENCODABLE_ID_CHARS}
      onChangeRunner={(scheme: DialApplicationScheme) => onChangeEntity({ ...entity, ...scheme })}
    />
  );
};

export default AppRunnerCreateProperties;
