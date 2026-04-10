import { FC } from 'react';

import Cloud from '@/public/images/icons/cloud.svg';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  domains: string[];
}

const DomainList: FC<Props> = ({ domains }) => {
  return (
    <ul className="flex flex-col gap-2">
      {domains.map((domain, index) => (
        <li key={`domain-${index}`} className="flex items-center gap-2 text-primary">
          <span className="text-secondary">
            <Cloud {...BASE_BUTTON_ICON_PROPS} />
          </span>
          <p className="dial-body-text">{domain}</p>
        </li>
      ))}
    </ul>
  );
};

export default DomainList;
