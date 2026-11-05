'use client';

import { FC } from 'react';

import { Button, ButtonVariant } from '@epam/ai-dial-ui-kit';

import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  count?: number;
  onOpen: () => void;
}

const IngestFailuresButton: FC<Props> = ({ count, onOpen }) => {
  const t = useI18n();
  const title = t(IngestFailuresI18nKey.Title);

  if (!count) return <Button variant={ButtonVariant.Neutral} label={title} onClick={onOpen} />;

  return (
    <Button
      variant={ButtonVariant.Neutral}
      label={
        <span className="flex flex-row items-center gap-x-2">
          <span>{title}</span>
          <span className="text-warning">{count}</span>
        </span>
      }
      aria-label={t(IngestFailuresI18nKey.ButtonAria, { count })}
      onClick={onOpen}
    />
  );
};

export default IngestFailuresButton;
