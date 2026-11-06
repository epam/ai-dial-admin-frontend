'use client';

import { FC, useMemo, useState } from 'react';

import { Checkbox, Input, Popup, PopupSize, Switch } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ResourceAccess } from '@/src/models/dial/resource-dependency';
import { PERSONAL_PATH_EXAMPLE, SHARED_PATH_EXAMPLE } from './constants';
import { DependencyFormErrors, DependencyFormValues, ValidationIssue } from './models';
import { isReadLocked, toggleAccess } from './utils/access';
import { hasDependencyErrors, validateDependency } from './utils/validate-dependency';

interface Props {
  isEdit?: boolean;
  initialValues: DependencyFormValues;
  /** Link IDs the edited dependency must not collide with — every other row of the declaration. */
  otherLinkIds: string[];
  onClose: () => void;
  onConfirm: (values: DependencyFormValues) => void;
}

type TouchableField = keyof DependencyFormErrors;

const DependencyModal: FC<Props> = ({ isEdit, initialValues, otherLinkIds, onClose, onConfirm }) => {
  const t = useI18n();
  const [values, setValues] = useState(initialValues);
  const [touchedFields, setTouchedFields] = useState<TouchableField[]>([]);

  const errors = useMemo(() => validateDependency(values, otherLinkIds), [values, otherLinkIds]);

  const onChangeValues = (changes: Partial<DependencyFormValues>, field?: TouchableField) => {
    setValues((current) => ({ ...current, ...changes }));
    if (field) {
      setTouchedFields((current) => (current.includes(field) ? current : [...current, field]));
    }
  };

  const onChangeAccess = (right: ResourceAccess, isSelected: boolean) =>
    onChangeValues({ access: toggleAccess(values.access, right, isSelected) }, 'access');

  const getErrorText = (field: TouchableField): string | undefined => {
    const issue: ValidationIssue | undefined = errors[field];
    return issue && touchedFields.includes(field) ? t(issue.key, issue.params) : undefined;
  };

  const linkIdError = getErrorText('linkId');
  const pathError = getErrorText('path');
  const accessError = getErrorText('access');

  return (
    <Popup
      open
      onClose={onClose}
      header={t(isEdit ? ResourceDependenciesI18nKey.EditDependency : ResourceDependenciesI18nKey.AddDependency)}
      portalId="resourceDependencyModal"
      size={PopupSize.Md}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(isEdit ? ButtonsI18nKey.Save : ButtonsI18nKey.Add),
        isSubmitDisabled: hasDependencyErrors(errors),
        onCancel: onClose,
        onSubmit: () => onConfirm(values),
      })}
    >
      <div className="flex flex-col gap-4 dial-small-text px-6 py-4">
        <Input
          id="resourceDependencyLinkId"
          labelProps={{ label: t(ResourceDependenciesI18nKey.LinkId), required: true }}
          value={values.linkId}
          error={linkIdError}
          invalid={!!linkIdError}
          onChange={(linkId) => onChangeValues({ linkId: linkId ?? '' }, 'linkId')}
        />
        <Input
          id="resourceDependencyPath"
          labelProps={{ label: t(ResourceDependenciesI18nKey.TargetPath), required: true }}
          placeholder={t(ResourceDependenciesI18nKey.TargetPathPlaceholder, {
            personal: PERSONAL_PATH_EXAMPLE,
            shared: SHARED_PATH_EXAMPLE,
          })}
          value={values.path}
          error={pathError}
          invalid={!!pathError}
          onChange={(path) => onChangeValues({ path: path ?? '' }, 'path')}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-secondary">{t(ResourceDependenciesI18nKey.Access)}</legend>
          <div className="flex flex-row gap-6">
            <Checkbox
              id="resourceDependencyRead"
              isSelected={values.access.includes(ResourceAccess.Read)}
              disabled={isReadLocked(values.access)}
              labelProps={{ label: t(ResourceDependenciesI18nKey.Read) }}
              onChange={(isSelected) => onChangeAccess(ResourceAccess.Read, isSelected)}
            />
            <Checkbox
              id="resourceDependencyWrite"
              isSelected={values.access.includes(ResourceAccess.Write)}
              labelProps={{ label: t(ResourceDependenciesI18nKey.Write) }}
              onChange={(isSelected) => onChangeAccess(ResourceAccess.Write, isSelected)}
            />
          </div>
          {accessError && (
            <p role="alert" className="dial-tiny-text text-error">
              {accessError}
            </p>
          )}
        </fieldset>
        <Switch
          id="resourceDependencyRequired"
          isOn={values.isRequired}
          labelProps={{ label: t(ResourceDependenciesI18nKey.Required) }}
          caption={t(ResourceDependenciesI18nKey.RequiredDescription)}
          onChange={(isRequired) => onChangeValues({ isRequired })}
        />
      </div>
    </Popup>
  );
};

export default DependencyModal;
