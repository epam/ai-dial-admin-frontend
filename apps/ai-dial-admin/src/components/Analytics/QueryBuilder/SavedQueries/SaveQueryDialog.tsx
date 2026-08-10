'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';
import {
  DialCheckbox,
  DialInput,
  DialNeutralButton,
  DialPopup,
  DialPrimaryButton,
  DialTextarea,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle } from '@tabler/icons-react';

import { useSavedQueryLabels } from '@/src/components/Analytics/QueryBuilder/SavedQueries/use-saved-query-labels';
import { SavedQueryErrorDescriptor } from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { ChartConfig, QueryResultView } from '@/src/models/analytics/query-builder';
import {
  SaveQueryDialogMode,
  SaveQueryForm,
  SavedQueryScope,
  SavedQueryTime,
  SavedQueryTimeMode,
} from '@/src/models/analytics/saved-query';

interface Props {
  open: boolean;
  mode: SaveQueryDialogMode;
  initial: SaveQueryForm;
  tagSuggestions: string[];
  resultView: QueryResultView;
  chartConfig: ChartConfig;
  // What the time checkbox would capture, so its label names the period rather than describing it.
  currentTime: SavedQueryTime;
  // The builder cannot run this query, so the service could not store it either.
  saveDisabled: boolean;
  isSaving: boolean;
  error: SavedQueryErrorDescriptor | null;
  onSave: (form: SaveQueryForm) => void;
  onClose: () => void;
}

const TITLE_KEYS: Record<SaveQueryDialogMode, QueryBuilderI18nKey> = {
  [SaveQueryDialogMode.Create]: QueryBuilderI18nKey.SaveQueryTitle,
  [SaveQueryDialogMode.SaveAsNew]: QueryBuilderI18nKey.SaveQueryAsNewTitle,
  [SaveQueryDialogMode.Rename]: QueryBuilderI18nKey.SavedQueryRenameTitle,
};

const SaveQueryDialog: FC<Props> = ({
  open,
  mode,
  initial,
  tagSuggestions,
  resultView,
  chartConfig,
  currentTime,
  saveDisabled,
  isSaving,
  error,
  onSave,
  onClose,
}) => {
  const t = useI18n();
  const { isFullAdmin, isEnableAuth } = useAppContext();
  const { periodLabel } = useSavedQueryLabels();

  const [form, setForm] = useState<SaveQueryForm>(initial);

  const patch = (partial: Partial<SaveQueryForm>) => setForm((prev) => ({ ...prev, ...partial }));

  const isRename = mode === SaveQueryDialogMode.Rename;
  const nameBlank = !form.name.trim();

  const isRelativeTime = currentTime.mode === SavedQueryTimeMode.Relative;

  const footer = (
    <div className="flex w-full justify-end gap-2 px-6 py-4">
      <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
      <DialPrimaryButton
        label={t(QueryBuilderI18nKey.SaveQuery)}
        disabled={nameBlank || isSaving || (!isRename && saveDisabled)}
        onClick={() => onSave(form)}
      />
    </div>
  );

  return (
    <DialPopup
      open={open}
      header={t(TITLE_KEYS[mode])}
      size={PopupSize.Md}
      portalId="SaveQueryDialog"
      footer={footer}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        <DialInput
          id="saved-query-name"
          labelProps={{ label: t(QueryBuilderI18nKey.SavedQueryName), required: true, htmlFor: 'saved-query-name' }}
          value={form.name}
          placeholder={t(QueryBuilderI18nKey.SavedQueryNamePlaceholder)}
          invalid={nameBlank}
          error={nameBlank ? t(QueryBuilderI18nKey.SavedQueryNameRequired) : undefined}
          onChange={(value) => patch({ name: value ?? '' })}
        />

        <DialTextarea
          id="saved-query-description"
          labelProps={{ label: t(QueryBuilderI18nKey.SavedQueryDescription), htmlFor: 'saved-query-description' }}
          value={form.description}
          placeholder={t(QueryBuilderI18nKey.SavedQueryDescriptionPlaceholder)}
          onChange={(value) => patch({ description: value })}
        />

        {/* A tag is free text on the service side — at most one, no vocabulary. The tags already in use
            at this scope are offered as one-click fills so the library's grouping does not fragment
            into near-duplicates, but anything can be typed. */}
        <div className="flex flex-col gap-1.5">
          <DialInput
            id="saved-query-tag"
            labelProps={{ label: t(QueryBuilderI18nKey.SavedQueryTag), htmlFor: 'saved-query-tag' }}
            value={form.tag}
            placeholder={t(QueryBuilderI18nKey.SavedQueryTagPlaceholder)}
            onChange={(value) => patch({ tag: value ?? '' })}
          />
          {!!tagSuggestions.length && (
            <div className="flex flex-wrap gap-1.5">
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={classNames(
                    'rounded border px-2 py-0.5 dial-tiny-text',
                    form.tag === tag
                      ? 'border-accent-primary bg-accent-primary-alpha text-primary'
                      : 'border-primary text-secondary hover:bg-layer-4',
                  )}
                  onClick={() => patch({ tag: form.tag === tag ? '' : tag })}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Writing `common` needs FULL_ADMIN, and changing scope on a replace needs write permission
            for both the stored and the requested scope — so the control a non-admin cannot use is not
            offered rather than shown and then rejected. */}
        {isFullAdmin && (
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1 p-0 text-secondary dial-tiny-text">
              {t(QueryBuilderI18nKey.SaveQueryDestination)}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[SavedQueryScope.Personal, SavedQueryScope.Common].map((scope) => {
                const isPersonal = scope === SavedQueryScope.Personal;
                return (
                  <button
                    key={scope}
                    type="button"
                    aria-pressed={form.scope === scope}
                    className={classNames(
                      'rounded border p-2.5 text-left',
                      form.scope === scope ? 'border-accent-primary bg-accent-primary-alpha' : 'border-primary',
                    )}
                    onClick={() => patch({ scope })}
                  >
                    <span className="block text-primary dial-tiny-semi-text">
                      {t(
                        isPersonal
                          ? QueryBuilderI18nKey.SaveQueryDestinationPersonal
                          : QueryBuilderI18nKey.SaveQueryDestinationCommon,
                      )}
                    </span>
                    {/* Both destinations always carry a description — dropping one leaves the pair
                        lopsided. With authentication off nothing is enforced and every scope is
                        readable by everyone, so the personal option describes where the query lands
                        rather than claiming a privacy that would not hold. */}
                    <span className="mt-1 block text-secondary dial-tiny-text">
                      {t(
                        !isPersonal
                          ? QueryBuilderI18nKey.SaveQueryDestinationCommonHint
                          : isEnableAuth
                            ? QueryBuilderI18nKey.SaveQueryDestinationPersonalHint
                            : QueryBuilderI18nKey.SaveQueryDestinationPersonalHintOpen,
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {!isRename && (
          <>
            <DialCheckbox
              id="saved-query-capture-time"
              checked={form.captureTime}
              label={t(QueryBuilderI18nKey.SaveQueryCaptureTime, { period: periodLabel(currentTime) })}
              onChange={() => patch({ captureTime: !form.captureTime })}
            />
            <span className="-mt-2 pl-6 text-secondary dial-tiny-text">
              {t(
                isRelativeTime
                  ? QueryBuilderI18nKey.SaveQueryCaptureTimeHintRelative
                  : QueryBuilderI18nKey.SaveQueryCaptureTimeHintAbsolute,
                { period: periodLabel(currentTime) },
              )}
            </span>

            {resultView === QueryResultView.Chart && (
              <>
                <DialCheckbox
                  id="saved-query-save-chart"
                  checked={form.saveAsChart}
                  label={t(QueryBuilderI18nKey.SaveQueryChart)}
                  onChange={() => patch({ saveAsChart: !form.saveAsChart })}
                />
                <span className="-mt-2 pl-6 text-secondary dial-tiny-text">
                  {t(QueryBuilderI18nKey.SaveQueryChartHint)}
                  {form.saveAsChart && (
                    <span className="ml-1 font-mono">
                      {chartConfig.type} · {chartConfig.xField ?? t(QueryBuilderI18nKey.SaveQueryChartAxisDefault)} /{' '}
                      {chartConfig.yField ?? t(QueryBuilderI18nKey.SaveQueryChartAxisDefault)}
                    </span>
                  )}
                </span>
              </>
            )}
          </>
        )}

        {/* The dialog keeps its values on a rejection: for an untranslatable body or a sensitive
            literal the repair is in the query, not in this form. */}
        {error && (
          <div className="flex items-start gap-2 rounded border border-error px-3 py-2 dial-tiny-text text-primary">
            <IconAlertTriangle size={16} className="mt-px shrink-0 text-error" />
            <span>
              {error.showServerMessage && !!error.serverMessage && (
                <span className="block font-mono">{error.serverMessage}</span>
              )}
              <span className="block">{t(error.hintKey)}</span>
            </span>
          </div>
        )}
      </div>
    </DialPopup>
  );
};

export default SaveQueryDialog;
