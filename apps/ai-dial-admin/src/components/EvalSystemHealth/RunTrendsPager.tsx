'use client';

import { FC } from 'react';

import { GhostIconButton } from '@epam/ai-dial-ui-kit';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import { ButtonsI18nKey, EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  /** Zero-based index of the current page. */
  page: number;
  totalPages: number;
  isDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const RunTrendsPager: FC<Props> = ({ page, totalPages, isDisabled, onPrevious, onNext }) => {
  const t = useI18n();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label={t(EvalSystemHealthI18nKey.RunTrendsPagination)} className="flex items-center justify-end gap-2">
      <GhostIconButton
        icon={<IconChevronLeft size={16} aria-hidden />}
        aria-label={t(ButtonsI18nKey.Previous)}
        disabled={isDisabled || page <= 0}
        onClick={onPrevious}
      />
      <span className="dial-small-text text-secondary" aria-live="polite">
        {t(EvalSystemHealthI18nKey.RunTrendsPageOf, { page: page + 1, pages: totalPages })}
      </span>
      <GhostIconButton
        icon={<IconChevronRight size={16} aria-hidden />}
        aria-label={t(ButtonsI18nKey.Next)}
        disabled={isDisabled || page >= totalPages - 1}
        onClick={onNext}
      />
    </nav>
  );
};

export default RunTrendsPager;
