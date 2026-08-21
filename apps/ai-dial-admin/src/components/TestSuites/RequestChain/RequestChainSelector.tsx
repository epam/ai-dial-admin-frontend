'use client';

import { FC, useMemo } from 'react';

import { DialGhostButton, DialGhostIconButton, DialTabs, ElementSize, TabModel } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconX } from '@tabler/icons-react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getRequestCount, getRequestName, MAX_ADDITIONAL_REQUESTS } from '@/src/utils/evaluation/request-chain';

interface Props {
  testSuite: TestSuite;
  selectedIndex: number;
  disabled?: boolean;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

const RequestChainSelector: FC<Props> = ({ testSuite, selectedIndex, disabled = false, onSelect, onAdd, onRemove }) => {
  const t = useI18n();
  const requestCount = getRequestCount(testSuite);
  const canAddRequest = !disabled && (testSuite.additionalRequests?.length ?? 0) < MAX_ADDITIONAL_REQUESTS;
  const canRemoveRequest = !disabled && selectedIndex > 0;

  const tabs: TabModel[] = useMemo(
    () =>
      Array.from({ length: requestCount }, (_, index) => ({
        id: String(index),
        label: `${index + 1}. ${getRequestName(testSuite, index) || t(TestSuitesI18nKey.Request)}`,
        disabled,
      })),
    [requestCount, testSuite, disabled, t],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2 flex-wrap">
        <DialTabs tabs={tabs} activeTab={String(selectedIndex)} onClick={(id) => !disabled && onSelect(Number(id))} />
        {canRemoveRequest && (
          <DialGhostIconButton
            icon={<IconX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            size={ElementSize.Small}
            aria-label={t(TestSuitesI18nKey.RemoveRequest)}
            onClick={() => onRemove(selectedIndex)}
          />
        )}
        <DialGhostButton
          label={t(TestSuitesI18nKey.AddRequest)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          size={ElementSize.Small}
          disabled={!canAddRequest}
          onClick={onAdd}
        />
      </div>
      <span className="dial-tiny-text text-secondary">{t(TestSuitesI18nKey.RequestChainHint)}</span>
    </div>
  );
};

export default RequestChainSelector;
