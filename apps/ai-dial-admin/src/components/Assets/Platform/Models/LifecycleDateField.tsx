'use client';

import { IconX } from '@tabler/icons-react';
import {
  Calendar,
  CalendarMode,
  CalendarValue,
  DIAL_ICON_SIZE,
  ElementSize,
  GhostIconButton,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo } from 'react';

import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { formatIsoDate, parseIsoDate } from '@/src/utils/models/lifecycle-date';

interface Props {
  id: string;
  label: string;
  /** The `YYYY-MM-DD` string held on the resource. */
  value?: string;
  onChange: (value?: string) => void;
}

/** A date Core stores as a plain `YYYY-MM-DD` string, edited through the kit `Calendar` and clearable. */
const LifecycleDateField: FC<Props> = ({ id, label, value, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const date = useMemo(() => parseIsoDate(value), [value]);

  const onPickDate = useCallback(
    (picked: CalendarValue) => {
      if (picked instanceof Date) {
        onChange(formatIsoDate(picked));
      }
    },
    [onChange],
  );

  const onClearDate = useCallback(() => onChange(undefined), [onChange]);

  return (
    <div className="flex items-end gap-x-2">
      <Calendar
        id={id}
        mode={CalendarMode.Date}
        labelProps={{ label }}
        placeholder={t(EntityPlaceholdersI18nKey.SelectDate)}
        value={date}
        onChange={onPickDate}
        className="w-[220px] gap-y-2"
        fieldClassName="h-10"
        disabled={isReadOnlyAdmin}
      />
      {value != null && (
        <div className="flex h-10 items-center">
          <GhostIconButton
            size={ElementSize.Small}
            icon={<IconX size={DIAL_ICON_SIZE.SM} aria-hidden />}
            aria-label={`${t(ButtonsI18nKey.Clear)} ${label}`}
            onClick={onClearDate}
            disabled={isReadOnlyAdmin}
          />
        </div>
      )}
    </div>
  );
};

export default LifecycleDateField;
