import { FC, MouseEvent, useCallback } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { DialButton } from '@epam/ai-dial-ui-kit';

import { useAppContext } from '@/src/context/AppContext';
import Hint from '@/src/components/Common/HintSIdebar/Hint';

interface Props {
  hintTitle: string;
  hintText: string;
  displayName: string;
}

const HeaderWithHintButton: FC<Props> = ({ displayName, hintText, hintTitle }) => {
  const { showHintSidebar } = useAppContext().hintSidebar;

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      showHintSidebar(<Hint title={hintTitle} text={hintText} />);
    },
    [hintText, hintTitle, showHintSidebar],
  );

  return (
    <div className="flex items-center w-full justify-end">
      <DialButton
        cssClass="flex items-center justify-center mr-2.5"
        iconBefore={<IconInfoCircle size={14} />}
        onClick={onClick}
      />
      {displayName}
    </div>
  );
};

export default HeaderWithHintButton;
