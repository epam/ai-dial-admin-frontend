import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import {
  DialAppRunnerResource,
  DialModelResource,
  DialPlatformApplicationResource,
  DialPlatformToolsetResource,
  PlatformAsset,
} from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/app-runners/constants';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { DUAL_BUCKET_VIEWS } from '@/src/utils/files/root-folder';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  names: string[];
  entity: PlatformAsset;
  onClose: () => void;
  onDuplicate: (entity: PlatformAsset) => void;
}

const DuplicatePlatformAsset: FC<Props> = ({ view, isModalOpen, names, entity, onClose, onDuplicate }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const isRunner = view === ApplicationRoute.PlatformAppRunners;
  // Applications/Toolsets carry their display name as `display_name` (snake_case, inherited from
  // `DialResource`), unlike Models/Interceptors' camelCase `displayName` — Core reuses the same
  // entity class for both buckets, so the field name doesn't change for a platform-bucket row.
  const isDualBucketAsset = DUAL_BUCKET_VIEWS.includes(view);
  const hasDisplayName =
    isRunner ||
    view === ApplicationRoute.PlatformModels ||
    view === ApplicationRoute.PlatformInterceptors ||
    isDualBucketAsset;

  const [clonedAsset, setClonedAsset] = useState<PlatformAsset>(() =>
    isRunner
      ? ({ ...entity, $id: getClonedEntityName((entity as DialAppRunnerResource).$id, true) } as DialAppRunnerResource)
      : ({ ...entity, name: getClonedEntityName(entity.name, true) } as DialModelResource),
  );

  const onChangeId = useCallback(
    ({ name }: { name?: string }) => {
      setClonedAsset((asset) => (isRunner ? { ...asset, $id: name } : { ...asset, name: name as string }));
    },
    [isRunner],
  );

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      setClonedAsset((asset) => {
        if (isRunner) {
          return { ...asset, 'dial:applicationTypeDisplayName': displayName };
        }
        return isDualBucketAsset ? { ...asset, display_name: displayName } : { ...asset, displayName };
      });
    },
    [isRunner, isDualBucketAsset],
  );

  const id = isRunner ? (clonedAsset as DialAppRunnerResource).$id : clonedAsset.name;
  const displayName = isRunner
    ? (clonedAsset as DialAppRunnerResource)['dial:applicationTypeDisplayName']
    : isDualBucketAsset
      ? (clonedAsset as DialPlatformApplicationResource | DialPlatformToolsetResource).display_name
      : (clonedAsset as DialModelResource).displayName;

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCloneTitle(view, t)}
      portalId="DuplicatePlatformAsset"
      open={isModalOpen}
      onSubmit={() => onDuplicate(clonedAsset)}
      onCancel={onClose}
      disableSubmitButton={!isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-y-8">
        <IdControl
          entity={{ name: id }}
          names={names}
          isUrlId={isRunner}
          forbiddenChars={isRunner ? CORE_UNENCODABLE_ID_CHARS : void 0}
          onChangeEntity={onChangeId}
        />
        {hasDisplayName && <DisplayNameControl displayName={displayName} onChange={onChangeDisplayName} required />}
      </div>
    </DialFormPopup>
  );
};

export default DuplicatePlatformAsset;
