'use client';

import { Dropdown, DropdownItem, GhostIconButton, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import { IconHelpCircle } from '@tabler/icons-react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { FC, useCallback, useMemo, useState } from 'react';

import { HELP_DOCUMENTATION_LINKS } from '@/src/constants/help-documentation-links';
import { HeaderI18nKey } from '@/src/constants/i18n';
import { TOOLTIP_PLACEMENT_BOTTOM_END } from '@/src/constants/tooltip';
import { useAppContext } from '@/src/context/AppContext';
import { useHelpTopic } from '@/src/context/HelpTopicContext';
import { getHelpUrl, isListView } from '@/src/utils/help/get-help-url';
import { useI18n } from '@/src/locales/client';

interface Props {
  docLink?: string;
}
const HelpButton: FC<Props> = ({ docLink }) => {
  const pathname = usePathname();
  const { featureFlags } = useAppContext();
  const { helpRoute } = useHelpTopic();
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  // A page that knows its own topic (a container's type) overrides the URL-derived one.
  const helpUrl = helpRoute ? HELP_DOCUMENTATION_LINKS[helpRoute] : getHelpUrl(pathname ?? '', featureFlags);
  const hasHelpLink = Boolean(helpUrl && docLink);

  const onClick = useCallback(() => {
    const isList = isListView(pathname ?? '');
    const url = isList ? helpUrl?.listView : helpUrl?.selectedView || helpUrl?.listView;
    window.open(`${docLink}${url}`, '_blank', 'noopener,noreferrer');
  }, [docLink, helpUrl?.listView, helpUrl?.selectedView, pathname]);

  const dropdownItems = useMemo<DropdownItem[]>(() => {
    if (!hasHelpLink) {
      return [];
    }

    const items: DropdownItem[] = [
      {
        key: 'help-link',
        label: helpUrl?.title || 'View documentation',
        onClick,
      },
    ];

    return items;
  }, [hasHelpLink, helpUrl, onClick]);

  if (!hasHelpLink) {
    return null;
  }
  return dropdownItems.length > 0 ? (
    <Dropdown items={dropdownItems} allowedPlacements={['bottom-end']} onOpenChange={setIsOpen} listClassName="mt-2">
      <GhostIconButton
        aria-label={t(HeaderI18nKey.Help)}
        tooltipProps={{
          tooltip: t(HeaderI18nKey.Help),
          placement: isOpen ? TooltipPlacement.Left : TOOLTIP_PLACEMENT_BOTTOM_END,
        }}
        className={classNames(isOpen && '!bg-control-accent-alpha-hover !text-accent')}
        icon={<IconHelpCircle size={24} stroke={1.5} aria-hidden />}
      />
    </Dropdown>
  ) : (
    <GhostIconButton
      aria-label={t(HeaderI18nKey.Help)}
      tooltipProps={{ tooltip: t(HeaderI18nKey.Help), placement: TOOLTIP_PLACEMENT_BOTTOM_END }}
      icon={<IconHelpCircle size={24} stroke={1.5} aria-hidden />}
      onClick={onClick}
    />
  );
};

export default HelpButton;
