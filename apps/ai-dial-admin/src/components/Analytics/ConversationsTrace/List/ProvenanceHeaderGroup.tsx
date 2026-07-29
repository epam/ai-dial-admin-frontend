'use client';

import { IconSparkles } from '@tabler/icons-react';
import { IHeaderGroupParams } from 'ag-grid-community';
import classNames from 'classnames';
import { FC } from 'react';

import { PROVENANCE_TEXT_CLASS } from '@/src/constants/analytics/conversations-trace';
import { ColumnProvenance } from '@/src/models/analytics/conversations-trace';

const ICON_SIZE = 12;

export interface ProvenanceHeaderGroupParams {
  label: string;
  provenance: ColumnProvenance;
  isDerived?: boolean;
}

const ProvenanceHeaderGroup: FC<IHeaderGroupParams & ProvenanceHeaderGroupParams> = ({
  label,
  provenance,
  isDerived,
}) => (
  <span
    className={classNames('flex items-center gap-1 dial-tiny-semi-text uppercase', PROVENANCE_TEXT_CLASS[provenance])}
  >
    {isDerived && <IconSparkles size={ICON_SIZE} aria-hidden />}
    {label}
  </span>
);

export default ProvenanceHeaderGroup;
