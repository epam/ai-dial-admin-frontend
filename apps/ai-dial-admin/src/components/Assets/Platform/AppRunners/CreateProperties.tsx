import { FC } from 'react';

import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/core-schemas/constants';

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
    <div className="flex flex-col gap-y-8">
      {isModal && (
        <IdControl
          label={EntityFieldsI18nKey.name}
          inputId="name"
          validationField="name"
          names={names}
          entity={{ name: entity.name }}
          onChangeEntity={({ name }) => onChangeEntity({ ...entity, name })}
        />
      )}
      <SchemeProperties
        names={[]}
        runner={entity}
        isModal={isModal}
        idForbiddenChars={CORE_UNENCODABLE_ID_CHARS}
        onChangeRunner={(scheme: DialApplicationScheme) => onChangeEntity({ ...entity, ...scheme })}
      />
    </div>
  );
};

export default AppRunnerCreateProperties;
