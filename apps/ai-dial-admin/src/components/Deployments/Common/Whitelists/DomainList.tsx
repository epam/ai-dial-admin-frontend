import classNames from 'classnames';
import { FC } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import Cloud from '@/public/images/icons/cloud.svg';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  domains: string[];
  errors?: Record<string, string[]>;
}

const DomainList: FC<Props> = ({ domains, errors }) => {
  return (
    <ul className="flex flex-col gap-2">
      {domains.map((domain, index) => {
        const domainErrors = errors?.[domain];
        const hasError = !!domainErrors?.length;

        return (
          <li key={`domain-${index}`} className="flex items-center gap-2">
            <span className={hasError ? 'text-error' : 'text-secondary'}>
              <Cloud {...BASE_BUTTON_ICON_PROPS} />
            </span>
            <p className={classNames('dial-body-text', hasError ? 'text-error' : 'text-primary')}>{domain}</p>
            {hasError && (
              <DialTooltip
                tooltip={
                  <div className="flex flex-col gap-1">
                    {domainErrors.map((message, i) => (
                      <div key={`${index}-${i}`}>{message}</div>
                    ))}
                  </div>
                }
              >
                <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-error" aria-label={domain} />
              </DialTooltip>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default DomainList;
