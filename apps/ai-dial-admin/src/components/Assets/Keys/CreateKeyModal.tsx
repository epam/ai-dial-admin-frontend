'use client';

import { DialFormPopup, DialInput } from '@epam/ai-dial-ui-kit';
import { SelectionChangedEvent } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { createKey, getKeyRolesOptions } from '@/src/app/[lang]/assets-keys/actions';
import IdControl from '@/src/components/BaseControls/Id/Id';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import GridView from '@/src/components/Grid/GridView/GridView';
import { MULTI_ROW_SELECTION } from '@/src/constants/ag-grid';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  KeysI18nKey,
  RolesI18nKey,
} from '@/src/constants/i18n';
import { useKeysFolder } from '@/src/context/assets/KeysFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialKeyResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { withSourceColumn } from '@/src/utils/config-entities/source-column';
import { getCreateEntityTitle } from '@/src/utils/entities/create-entity';
import { generateKey } from '@/src/utils/keys/generate-key';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

enum CreateStep {
  Details = 'details',
  Roles = 'roles',
  Reveal = 'reveal',
}

interface Props {
  isOpen: boolean;
  names: string[];
  onClose: () => void;
}

/**
 * Three-step key creation modal.
 *
 * Step 1 (Details): resource name (identifier) + project. Both are required by Core's
 * `validateProjectKey`, which rejects a blank `project` with a 400.
 * Step 2 (Roles): pick the roles this key grants its bearer. Core's `validateProjectKey`
 * also rejects a key with no role assigned, so at least one is required before Create.
 * Role selection mirrors `KeyRoles`/`AddEntitiesView`: a grid of chosen roles with a remove
 * action, and an Add button that opens `AddEntitiesGrid` (checkbox multi-select).
 * Step 3 (Reveal): the generated key value with a copy button. Only visible here — Core
 * never returns `key` on subsequent GETs (`@JsonProperty(WRITE_ONLY)`).
 *
 * This modal cannot go through `handleCreateAsset` because that helper always calls
 * `handleModalClose()` immediately on success, which would prevent the reveal step from
 * showing. Instead it calls `createKey` directly and manages the folder refresh itself.
 */
const CreateKeyModal: FC<Props> = ({ isOpen, names, onClose }) => {
  const t = useI18n();
  const router = useRouter();
  const { dispatch } = useSaveValidationContext();
  const { fetchFiles } = useKeysFolder();

  const [step, setStep] = useState<CreateStep>(CreateStep.Details);
  const [asset, setAsset] = useState<DialKeyResource>({ name: '', project: '' } as unknown as DialKeyResource);
  const [roles, setRoles] = useState<DialRole[]>([]);
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);
  const [createdKeyValue, setCreatedKeyValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load the role option list once when the modal opens — same read the detail page uses, so the
  // picker offers exactly the roles Core validates a reference against.
  useEffect(() => {
    if (isOpen && roles.length === 0) {
      getKeyRolesOptions()
        .then(setRoles)
        .catch(() => setRoles([]));
    }
  }, [isOpen, roles.length]);

  // Reset validation whenever the step changes so the submit gate reflects the active step's fields.
  useEffect(() => {
    dispatch({ type: ValidationActionType.Reset });
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!asset.name });
    dispatch({ type: ValidationActionType.SetField, field: 'project', isValid: !!asset.project });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const onChangeName = useCallback(({ name }: { name?: string }) => {
    setAsset((prev) => ({ ...prev, name: name || '' }));
  }, []);

  const onChangeProject = useCallback(
    (project?: string) => {
      setAsset((prev) => ({ ...prev, project: project || '' }));
      dispatch({ type: ValidationActionType.SetField, field: 'project', isValid: !!project });
    },
    [dispatch],
  );

  // The roles step mirrors `AddEntitiesGrid`'s grid: checkbox multi-select over the full role list,
  // with the same source column and `MULTI_ROW_SELECTION` options.
  const rolesColumnDefs = useMemo(() => withSourceColumn(BASE_COLUMNS, roles), [roles]);

  const onRolesSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const rows = event.api.getSelectedRows() as DialRole[];
    setSelectedRoleNames(rows.map((role) => role.name as string));
  }, []);

  const onCloseAndReset = useCallback(() => {
    const wasCreated = !!createdKeyValue;
    const createdName = asset.name;
    setStep(CreateStep.Details);
    setAsset({ name: '', project: '' } as unknown as DialKeyResource);
    setSelectedRoleNames([]);
    setCreatedKeyValue('');
    onClose();
    // After a successful create, the reveal step's Close navigates to the new key's detail page —
    // same behavior as every other asset's create flow. Navigation runs after state reset so the
    // modal doesn't flicker with stale data during the route transition.
    if (wasCreated && createdName) {
      router.push(getUrnForEntity(ApplicationRoute.AssetsKeys, { name: createdName }));
    }
  }, [asset.name, createdKeyValue, onClose, router]);

  const onSubmit = useCallback(() => {
    if (step === CreateStep.Details) {
      setStep(CreateStep.Roles);
      return;
    }
    if (step === CreateStep.Roles) {
      const generated = generateKey();
      setIsLoading(true);
      createKey({ ...asset, roles: selectedRoleNames, key: generated }).then((res) => {
        setIsLoading(false);
        if (res.success) {
          setCreatedKeyValue(generated);
          setStep(CreateStep.Reveal);
          fetchFiles(asset.folderId);
        }
      });
      return;
    }
    // Reveal step — close (navigates to the new key's detail page via onCloseAndReset).
    onCloseAndReset();
  }, [step, asset, selectedRoleNames, fetchFiles, onCloseAndReset]);

  const onBack = useCallback(() => {
    setStep(CreateStep.Details);
  }, []);

  const isDetailsValid = !!asset.name && !!asset.project;
  const isRolesValid = selectedRoleNames.length > 0;

  if (step === CreateStep.Details) {
    return (
      <DialFormPopup
        open={isOpen}
        header={getCreateEntityTitle(ApplicationRoute.AssetsKeys, t)}
        portalId="CreateKeyDetails"
        onClose={onCloseAndReset}
        onCancel={onCloseAndReset}
        onSubmit={onSubmit}
        disableSubmitButton={!isDetailsValid}
        cancelLabel={t(ButtonsI18nKey.Cancel)}
        submitLabel={t(ButtonsI18nKey.Next)}
      >
        <div className="flex flex-col px-6 py-4 gap-y-8">
          <IdControl entity={asset} names={names} onChangeEntity={onChangeName} />
          <DialInput
            id="project"
            labelProps={{ label: t(EntityFieldsI18nKey.project), required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.Project)}
            value={asset.project}
            onChange={onChangeProject}
            containerClassName="w-full"
          />
        </div>
      </DialFormPopup>
    );
  }

  if (step === CreateStep.Roles) {
    return (
      <DialFormPopup
        open={isOpen}
        header={t(RolesI18nKey.AddRoles)}
        portalId="CreateKeyRoles"
        isLoading={isLoading}
        onClose={onCloseAndReset}
        onCancel={onBack}
        onSubmit={onSubmit}
        disableSubmitButton={!isRolesValid}
        cancelLabel={t(ButtonsI18nKey.Back)}
        submitLabel={t(ButtonsI18nKey.Create)}
      >
        <div className="flex flex-col px-6 py-4 h-full min-h-0">
          <p className="text-secondary small-150 mb-4">{t(KeysI18nKey.BearerRolesDescription)}</p>
          <GridView
            emptyDataProps={{ title: t(KeysI18nKey.NoRolesAvailable) }}
            columnDefs={rolesColumnDefs}
            rowData={roles}
            additionalGridOptions={{
              ...MULTI_ROW_SELECTION,
              onSelectionChanged: onRolesSelectionChanged,
            }}
          />
        </div>
      </DialFormPopup>
    );
  }

  return (
    <DialFormPopup
      open={isOpen}
      header={t(KeysI18nKey.KeyValueRevealTitle)}
      portalId="CreateKeyReveal"
      onClose={onCloseAndReset}
      onCancel={onCloseAndReset}
      onSubmit={onCloseAndReset}
      cancelLabel={t(ButtonsI18nKey.Close)}
      submitClassName="hidden"
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        <p className="body-2">{t(KeysI18nKey.KeyValueRevealDescription)}</p>
        <div className="flex items-center gap-2">
          <code className="body-2 font-mono break-all">{createdKeyValue}</code>
          <CopyButton valueLabel={t(KeysI18nKey.KeyValueRevealTitle)} value={createdKeyValue} />
        </div>
      </div>
    </DialFormPopup>
  );
};

export default CreateKeyModal;
