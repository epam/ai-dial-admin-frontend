import { FC } from 'react';

import { CaseWarning } from './models';

interface Props {
  warnings?: CaseWarning[];
}

const ImportWarningsList: FC<Props> = ({ warnings }) => {
  if (!warnings?.length) return null;

  return (
    <div className="flex flex-col gap-1">
      {(warnings ?? []).map((warning) => (
        <div key={`${warning.rowNumber}-${warning.columnName}`} className="dial-small-sime-text text-warning">
          {`${warning.columnName}: ${warning.message}`}
        </div>
      ))}
    </div>
  );
};

export default ImportWarningsList;
