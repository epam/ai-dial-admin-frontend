import { FC } from 'react';
import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { getActionClass } from '@/src/utils/deployments/images';
import { STATUS_I18N_KEYS } from '@/src/constants/deployments/images';

interface Props {
  status: IMAGE_STATUS | CONTAINER_STATUS;
}

const StatusIndicator: FC<Props> = ({ status }) => {
  const t = useI18n();
  const indicatorClassNames = classNames('flex w-2 h-2 mr-1 rounded no-user-select', getActionClass(status));

  return (
    <div className="flex items-center">
      {status === IMAGE_STATUS.BUILDING ||
      status === CONTAINER_STATUS.PENDING ||
      status === CONTAINER_STATUS.STOPPING ? (
        <div className="mr-2">
          <DialLoader size={16} className="w-2 h-2" />
        </div>
      ) : (
        <span className={indicatorClassNames} />
      )}
      <p className="flex-inline truncate">{t(STATUS_I18N_KEYS[status])}</p>
    </div>
  );
};

export default StatusIndicator;
