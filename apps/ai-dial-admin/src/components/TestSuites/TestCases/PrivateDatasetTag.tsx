'use client';

import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant, Tooltip } from '@epam/ai-dial-ui-kit';

import { DatasetsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/**
 * The "Private" tag shown while the suite's test cases belong to a private dataset. `Badge` is static, so the
 * trigger is a focusable wrapper — that is how the explanation opens from the keyboard — and `asChild` lands
 * the tooltip's `aria-describedby` on it for assistive technology.
 */
const PrivateDatasetTag: FC = () => {
  const t = useI18n();

  return (
    <Tooltip tooltip={t(TestSuitesI18nKey.TestCasesPrivateTagTooltip)} asChild>
      <span
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focus is how the tooltip is reached from the keyboard
        tabIndex={0}
        className="flex items-center rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
      >
        <Badge label={t(DatasetsI18nKey.VisibilityPrivate)} variant={BadgeVariant.Filled} color={BadgeColor.Violet} />
      </span>
    </Tooltip>
  );
};

export default PrivateDatasetTag;
