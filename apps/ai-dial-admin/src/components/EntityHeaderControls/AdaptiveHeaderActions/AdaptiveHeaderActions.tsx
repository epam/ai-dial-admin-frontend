'use client';

import { FC, useEffect, useRef, useState } from 'react';

import {
  ButtonAppearance,
  DialDangerButton,
  DialDropdown,
  DialIconButton,
  DialLinkButton,
  DialNeutralButton,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';
import { IconDotsVertical } from '@tabler/icons-react';
import classNames from 'classnames';

import {
  AdaptiveHeaderAction,
  AdaptiveHeaderActionsConfig,
} from '@/src/components/EntityHeaderControls/AdaptiveHeaderActions/models';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  actions: AdaptiveHeaderActionsConfig;
  deleteAction: AdaptiveHeaderAction;
  buttonsClassName?: string;
}

const GAP_PX = 16;

const renderExpandedAction = (action: AdaptiveHeaderAction, buttonsClassName?: string) => {
  const key = action.id;
  const common = {
    label: action.label,
    iconBefore: action.icon,
    onClick: action.onClick,
    disabled: action.disabled,
    className: classNames('shrink-0', buttonsClassName),
  };

  let button;
  if (action.appearance === 'link') {
    button = <DialLinkButton key={key} {...common} />;
  } else if (action.appearance === 'danger') {
    button = <DialDangerButton key={key} {...common} appearance={ButtonAppearance.Outlined} />;
  } else {
    button = <DialNeutralButton key={key} {...common} />;
  }

  if (!action.dividerAfter) {
    return button;
  }

  return (
    <div key={key} className="flex items-center gap-x-4 shrink-0">
      {button}
      <div className="w-px h-6 bg-layer-4" aria-hidden />
    </div>
  );
};

const AdaptiveHeaderActions: FC<Props> = ({ actions, deleteAction, buttonsClassName }) => {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  const leading = actions.leading ?? [];
  const trailing = actions.trailing ?? [];

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) {
      return;
    }

    const update = () => {
      setIsCompact(measure.scrollWidth > container.clientWidth);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [leading.length, trailing.length, deleteAction.label]);

  const renderExpandedActions = () => [
    ...leading.map((action) => renderExpandedAction(action, buttonsClassName)),
    renderExpandedAction(deleteAction, buttonsClassName),
    ...trailing.map((action) => renderExpandedAction(action, buttonsClassName)),
  ];

  const menuActions = [...leading, ...trailing, deleteAction];
  const dropdownItems: DropdownItem[] = menuActions.map((action) => ({
    key: action.id,
    disabled: action.disabled,
    label: (
      <div className="text-secondary flex-row flex size-full gap-3 items-center">
        {action.icon}
        <span className="text-primary small">{action.label}</span>
      </div>
    ),
    onClick: action.onClick,
  }));

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0 flex flex-row items-center justify-end">
      <div
        ref={measureRef}
        className="absolute left-0 top-0 opacity-0 pointer-events-none -z-10 flex flex-row items-center whitespace-nowrap"
        style={{ gap: GAP_PX }}
        aria-hidden
      >
        {renderExpandedActions()}
      </div>

      {isCompact ? (
        <DialDropdown items={dropdownItems} listClassName="min-w-[200px]" placement="bottom-end">
          <DialIconButton
            aria-label={t(ButtonsI18nKey.ShowMore)}
            icon={<IconDotsVertical {...BASE_BUTTON_ICON_PROPS} />}
            className="inline-flex items-center justify-center border border-primary rounded size-10 shrink-0 text-primary p-0"
          />
        </DialDropdown>
      ) : (
        <div className="flex flex-row items-center" style={{ gap: GAP_PX }}>
          {renderExpandedActions()}
        </div>
      )}
    </div>
  );
};

export default AdaptiveHeaderActions;
