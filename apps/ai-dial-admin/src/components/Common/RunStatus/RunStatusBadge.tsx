import { FC } from 'react';

import StatusBadge from '@/src/components/Common/StatusBadge/StatusBadge';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { getRunErrorHint, getRunStatusPresentation, getStatusLabel } from './utils';

interface Props {
  run: Run;
}

const RunStatusBadge: FC<Props> = ({ run }) => {
  const t = useI18n();

  if (!run.status) {
    return null;
  }

  const { tone, leading } = getRunStatusPresentation(run.status);

  return (
    <StatusBadge tone={tone} leading={leading} label={getStatusLabel(run.status, t)} hint={getRunErrorHint(run)} />
  );
};

export default RunStatusBadge;
