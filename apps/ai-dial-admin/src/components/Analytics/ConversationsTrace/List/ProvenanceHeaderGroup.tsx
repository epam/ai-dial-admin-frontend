'use client';

import { IHeaderGroupParams } from 'ag-grid-community';
import classNames from 'classnames';
import { FC } from 'react';

import { PROVENANCE_TEXT_CLASS } from '@/src/constants/analytics/conversations-trace';
import { ColumnProvenance } from '@/src/models/analytics/conversations-trace';

export interface ProvenanceHeaderGroupParams {
  label: string;
  provenance: ColumnProvenance;
}

const ProvenanceHeaderGroup: FC<IHeaderGroupParams & ProvenanceHeaderGroupParams> = ({ label, provenance }) => (
  <span className={classNames('flex items-center gap-1 dial-tiny-semi-text', PROVENANCE_TEXT_CLASS[provenance])}>
    {label}
  </span>
);

export default ProvenanceHeaderGroup;
