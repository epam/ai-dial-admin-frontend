'use client';

import { FC } from 'react';

import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';

import ConditionCheckLine from '@/src/components/Analytics/Pipelines/Groups/ConditionCheckLine';
import { GroupCheck } from '@/src/components/Analytics/Pipelines/Groups/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  checks: GroupCheck[];
  now: number;
}

/**
 * A group's declared conditions against its own facts, one line each. Shared by the state tooltip and the
 * evaluation dialog, so the explanation a reader gets is the same in both.
 *
 * The mark is decorative; whether a line holds is also stated in words for assistive technology.
 */
const ConditionChecklist: FC<Props> = ({ checks, now }) => {
  const t = useI18n();

  return (
    <ul className="flex flex-col gap-1 dial-small-text text-primary">
      {checks.map((check) => (
        <li key={check.condition} className="flex flex-row items-start gap-2">
          {check.isSatisfied ? (
            <IconCircleCheck {...BASE_BUTTON_ICON_PROPS} className="mt-0.5 shrink-0 text-success" aria-hidden />
          ) : (
            <IconCircleX {...BASE_BUTTON_ICON_PROPS} className="mt-0.5 shrink-0 text-error" aria-hidden />
          )}
          <span>
            <span className="sr-only">
              {t(
                check.isSatisfied
                  ? AnalyticsPipelinesI18nKey.GroupsCheckMet
                  : AnalyticsPipelinesI18nKey.GroupsCheckNotMet,
              )}
              {': '}
            </span>
            <ConditionCheckLine check={check} now={now} />
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ConditionChecklist;
