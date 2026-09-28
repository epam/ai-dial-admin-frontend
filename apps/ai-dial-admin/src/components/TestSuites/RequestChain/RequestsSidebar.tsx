'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialCollapsibleSidebar, DialPrimaryButton, DialTooltip, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconDotsVertical, IconInfoCircle, IconPencilMinus, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { ActionMenuOperationI18nKey, ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getRequestCount, getRequestName, MAX_ADDITIONAL_REQUESTS } from '@/src/utils/evaluation/request-chain';
import RenameRequestModal from './RenameRequestModal';

interface Props {
  testSuite: TestSuite;
  selectedIndex: number;
  disabled?: boolean;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onRename: (index: number, name: string) => void;
}

const RequestsSidebar: FC<Props> = ({
  testSuite,
  selectedIndex,
  disabled = false,
  onSelect,
  onAdd,
  onRemove,
  onRename,
}) => {
  const t = useI18n();
  const requestCount = getRequestCount(testSuite);
  const canAddRequest = !disabled && (testSuite.additionalRequests?.length ?? 0) < MAX_ADDITIONAL_REQUESTS;
  const [renameIndex, setRenameIndex] = useState<number | null>(null);

  const requests = useMemo(
    () =>
      Array.from({ length: requestCount }, (_, index) => {
        const name = getRequestName(testSuite, index) ?? '';
        return { index, name, label: name || `${t(TestSuitesI18nKey.Request)} ${index + 1}` };
      }),
    [requestCount, testSuite, t],
  );

  const getRowActions = useCallback(
    (index: number): ActionMenuOperationDeclaration<object>[] => {
      const items: ActionMenuOperationDeclaration<object>[] = [
        {
          id: ActionMenuOperationI18nKey.Rename,
          label: ActionMenuOperationI18nKey.Rename,
          icon: <IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />,
          onClick: () => setRenameIndex(index),
        },
      ];

      if (index > 0) {
        items.push(getDeleteOperation<object>(() => onRemove(index)));
      }

      return items;
    },
    [onRemove],
  );

  const renamingRequest = renameIndex != null ? requests[renameIndex] : undefined;

  return (
    <>
      <DialCollapsibleSidebar width={296} title={t(TestSuitesI18nKey.Requests)} containerClassName="h-full bg-layer-3">
        <div className="flex flex-col gap-6 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="dial-h1-text">{t(TestSuitesI18nKey.Requests)}</span>
              <DialTooltip tooltip={t(TestSuitesI18nKey.RequestChainHint)}>
                <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} size={16} className="text-secondary" />
              </DialTooltip>
            </div>
            <DialPrimaryButton
              label={t(ButtonsI18nKey.Add)}
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              size={ElementSize.Small}
              disabled={!canAddRequest}
              onClick={onAdd}
            />
          </div>

          <div role="tablist" aria-orientation="vertical" className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            {requests.map(({ index, label }) => {
              const isActive = index === selectedIndex;

              return (
                <div
                  key={index}
                  className={classNames(
                    'group flex items-center gap-2 rounded border-l-2 border-transparent hover:bg-accent-primary-alpha',
                    isActive && 'bg-accent-primary-alpha border-l-accent-primary',
                  )}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    disabled={disabled}
                    className="flex-1 min-w-0 text-left px-3 py-2 truncate disabled:cursor-not-allowed"
                    onClick={() => onSelect(index)}
                  >
                    {label}
                  </button>
                  {!disabled && (
                    <ActionsDropdown
                      items={getRowActions(index)}
                      icon={<IconDotsVertical {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                      actionTriggerClassName="mr-2 shrink-0 flex size-6 items-center justify-center rounded opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 hover:bg-accent-primary-alpha"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialCollapsibleSidebar>

      {renamingRequest && (
        <RenameRequestModal
          isOpen
          initialName={renamingRequest.name}
          onClose={() => setRenameIndex(null)}
          onConfirm={(name) => {
            onRename(renamingRequest.index, name);
            setRenameIndex(null);
          }}
        />
      )}
    </>
  );
};

export default RequestsSidebar;
