'use client';

import { FC, MouseEvent, useCallback } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { DialIconButton } from '@epam/ai-dial-ui-kit';

import { useAppContext } from '@/src/context/AppContext';
import Hint from '@/src/components/Common/Sidebar/Hint';

interface Props {
  hintTitle: string;
  hintText: string;
  displayName: string;
}

const HeaderWithHintButton: FC<Props> = ({ displayName, hintText, hintTitle }) => {
  const { showSidebar } = useAppContext().sidebar;

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      showSidebar(<Hint title={hintTitle} text={hintText} />);
    },
    [hintText, hintTitle, showSidebar],
  );

  return (
    <div className="flex items-center w-full justify-end">
      <DialIconButton className="mr-2.5 p-0 h-auto w-auto" icon={<IconInfoCircle size={14} />} onClick={onClick} />
      {displayName}
    </div>
  );
};

export default HeaderWithHintButton;
