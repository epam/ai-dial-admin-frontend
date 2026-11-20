import { FC, useEffect, useState } from 'react';

import Search from '@/src/components/Common/Search/Search';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onPendingChange: (isPending: boolean) => void;
}

const DebouncedToolsSearch: FC<Props> = ({ value, onChange, onPendingChange }) => {
  const [input, setInput] = useState(value);

  useEffect(() => {
    const isPending = input !== value;
    onPendingChange(isPending);
    if (!isPending) return;
    const timeout = setTimeout(() => {
      onChange(input);
      onPendingChange(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [input, onChange, onPendingChange, value]);

  return <Search value={input} onChange={setInput} />;
};

export default DebouncedToolsSearch;
