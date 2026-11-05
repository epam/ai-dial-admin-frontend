'use client';

import { FC } from 'react';
import { IHeaderParams } from 'ag-grid-community';

const VisuallyHiddenHeader: FC<IHeaderParams> = ({ displayName }) => <span className="sr-only">{displayName}</span>;

export default VisuallyHiddenHeader;
