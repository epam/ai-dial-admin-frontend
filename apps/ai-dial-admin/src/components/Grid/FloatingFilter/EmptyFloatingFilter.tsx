import { FC } from 'react';

import { FILTER_BUTTON_ONLY_CLASS } from '@/src/constants/ag-grid';

/**
 * Renders no filter body, leaving the filter row with just its filter button — centred by the marker
 * class below. For columns whose values a free-text query cannot express, a fixed status for
 * instance, where the filter menu is the only sensible way in.
 */
const EmptyFloatingFilter: FC = () => <span className={FILTER_BUTTON_ONLY_CLASS} aria-hidden />;

export default EmptyFloatingFilter;
