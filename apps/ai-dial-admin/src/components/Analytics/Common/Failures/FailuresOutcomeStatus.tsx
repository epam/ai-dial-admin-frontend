import { FC } from 'react';

interface Props {
  message: string;
}

const FailuresOutcomeStatus: FC<Props> = ({ message }) => (
  <span role="status" aria-live="polite" className={message ? 'dial-small-text text-secondary' : 'sr-only'}>
    {message}
  </span>
);

export default FailuresOutcomeStatus;
