'use client';

import { ButtonAppearance, DialDropdown, DialPrimaryIconButton, DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconHelpCircle } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { FC, useCallback, useMemo } from 'react';

import { getHelpUrl, isListView } from '@/src/utils/help/get-help-url';

interface Props {
  docLink?: string;
}
const HelpButton: FC<Props> = ({ docLink }) => {
  const pathname = usePathname();
  const helpUrl = getHelpUrl(pathname ?? '');
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
    <DialDropdown menu={{ items: dropdownItems }} allowedPlacements={['bottom-end']}>
      <DialPrimaryIconButton
        appearance={ButtonAppearance.Ghost}
        aria-label="Help button"
        icon={<IconHelpCircle size={24} stroke={1.5} />}
      />
    </DialDropdown>
  ) : (
    <DialPrimaryIconButton
      appearance={ButtonAppearance.Ghost}
      aria-label="Help button"
      icon={<IconHelpCircle size={24} stroke={1.5} />}
      onClick={onClick}
    />
  );
};

export default HelpButton;
