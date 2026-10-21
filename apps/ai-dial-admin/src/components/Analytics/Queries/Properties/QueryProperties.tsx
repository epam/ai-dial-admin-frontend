'use client';

import { FC, useCallback, useMemo } from 'react';

import { DialInput, DialRadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import type { RadioButtonWithContent } from '@epam/ai-dial-ui-kit';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { QueriesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { SavedQueryScope } from '@/src/models/analytics/saved-query';
import { QueryMetadataForm } from '@/src/components/Analytics/Queries/models';

interface Props {
  form: QueryMetadataForm;
  onChange: (patch: Partial<QueryMetadataForm>) => void;
  isModal?: boolean;
}

const QueryProperties: FC<Props> = ({ form, onChange, isModal }) => {
  const t = useI18n();
  const { isFullAdmin } = useAppContext();

  const onChangeName = useCallback((name?: string) => onChange({ name: name ?? '' }), [onChange]);

  const onChangeDescription = useCallback(
    (next: QueryMetadataForm) => onChange({ description: next.description }),
    [onChange],
  );

  const onChangeTag = useCallback((tag: string) => onChange({ tag }), [onChange]);

  const onChangeScope = useCallback((scope: SavedQueryScope) => onChange({ scope }), [onChange]);

  const scopeOptions: RadioButtonWithContent[] = useMemo(
    () => [
      {
        id: SavedQueryScope.Personal,
        name: t(QueriesI18nKey.ScopePersonal),
        caption: t(QueriesI18nKey.ScopePersonalHint),
      },
      {
        id: SavedQueryScope.Common,
        name: t(QueriesI18nKey.ScopeCommon),
        caption: t(QueriesI18nKey.ScopeCommonHint),
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <DisplayNameControl isFullWidth={isModal} onChange={onChangeName} displayName={form.name} required />

      <DescriptionControl isFullWidth={isModal} onChangeEntity={onChangeDescription} entity={form} />

      <DialInput
        id="query-tag"
        labelProps={{ label: t(QueriesI18nKey.Tag) }}
        value={form.tag}
        onChange={(value) => onChangeTag(value ?? '')}
      />

      {isFullAdmin && (
        <DialRadioGroup
          elementId="query-scope"
          fieldTitle={t(QueriesI18nKey.Scope)}
          orientation={RadioGroupOrientation.Column}
          radioButtons={scopeOptions}
          activeRadioButton={form.scope}
          onChange={(id) => onChangeScope(id as SavedQueryScope)}
        />
      )}
    </div>
  );
};

export default QueryProperties;
