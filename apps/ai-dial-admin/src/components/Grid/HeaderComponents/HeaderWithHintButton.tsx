import { FC, MouseEvent, useCallback, useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

import { useAppContext } from '@/src/context/AppContext';

import Button from '@/src/components/Common/Button/Button';
import Hint from '@/src/components/Common/HintSIdebar/Hint';

interface Props {
  hintTitle: string;
  hintText: string;
  displayName: string;
  progressSort: (shiftKey?: boolean) => void;
  column: {
    getSort: () => 'asc' | 'desc' | null;
    addEventListener: (event: string, callback: () => void) => void;
    removeEventListener: (event: string, callback: () => void) => void;
  };
}

const HeaderWithHintButton: FC<Props> = ({ displayName, hintText, hintTitle, progressSort, column }) => {
  const { showHintSidebar } = useAppContext().hintSidebar;
  const [sort, setSort] = useState(column.getSort());

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      showHintSidebar(<Hint title={hintTitle} text={hintText} />);
    },
    [hintText, hintTitle, showHintSidebar],
  );

  useEffect(() => {
    const updateSortState = () => {
      setSort(column.getSort());
    };
    column.addEventListener('sortChanged', updateSortState);
    return () => column.removeEventListener('sortChanged', updateSortState);
  }, [column]);

  return (
    <div className="flex items-center w-full justify-end ag-header-cell-label">
      <Button
        cssClass="flex items-center justify-center mr-2.5"
        iconBefore={<IconInfoCircle size={14} />}
        onClick={onClick}
      />
      <span className="ag-header-cell-text" onClick={(e) => progressSort(e.shiftKey)}>
        {displayName}
      </span>
      <span className="ag-sort-indicator-container">
        {sort === 'asc' && (
          <span className="ag-sort-indicator-icon ag-sort-ascending-icon">
            <span className="ag-icon ag-icon-asc"></span>
          </span>
        )}
        {sort === 'desc' && (
          <span className="ag-sort-indicator-icon ag-sort-descending-icon">
            <span className="ag-icon ag-icon-desc"></span>
          </span>
        )}
      </span>
    </div>
  );
};

export default HeaderWithHintButton;
