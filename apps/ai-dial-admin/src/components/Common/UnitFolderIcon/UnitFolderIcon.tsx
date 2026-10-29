import { FC } from 'react';

import { DIAL_ICON_SIZE } from '@epam/ai-dial-ui-kit';
import { IconSitemap } from '@tabler/icons-react';

/** Marks an org unit's folder in trees and lists; neutral so it reads on both themes next to the blue folder icon. */
const UnitFolderIcon: FC = () => <IconSitemap size={DIAL_ICON_SIZE.MD} className="text-secondary" aria-hidden />;

export default UnitFolderIcon;
