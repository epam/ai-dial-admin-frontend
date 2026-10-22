import { FC } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import { POPUP_LOADER_SIZE } from '@/src/components/Common/FormPopup/constants';

const PopupLoader: FC = () => (
  <div className="px-6 py-4 h-[120px]">
    <Spinner size={POPUP_LOADER_SIZE} fullWidth />
  </div>
);

export default PopupLoader;
