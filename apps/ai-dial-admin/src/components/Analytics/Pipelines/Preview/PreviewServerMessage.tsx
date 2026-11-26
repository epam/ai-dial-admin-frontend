import { FC } from 'react';

import classNames from 'classnames';

import { NOTIFICATION_MESSAGE_WRAP_CLASS } from '@/src/constants/analytics/pipelines';

interface Props {
  message?: string;
}

/** The service's own words, untouched, where the reader can select and copy them. */
const PreviewServerMessage: FC<Props> = ({ message }) =>
  message ? (
    <p
      className={classNames(
        'rounded bg-layer-base px-2.5 py-2 font-mono dial-tiny-text text-primary',
        NOTIFICATION_MESSAGE_WRAP_CLASS,
      )}
    >
      {message}
    </p>
  ) : null;

export default PreviewServerMessage;
