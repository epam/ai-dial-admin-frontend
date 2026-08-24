'use client';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import { FC } from 'react';

const ICON_SIZE = 14;

// A caveat on a figure has to reach a keyboard, and neither a `<dt>` nor a `<span>` takes focus — so it hangs
// off a real control whose accessible name *is* the caveat, with the icon hidden so it does not compete with
// that name. Focus-visible mirrors hover, so a keyboard gets the same feedback a pointer does.
const FieldCaveat: FC<{ caveat: string }> = ({ caveat }) => (
  <DialTooltip tooltip={<span>{caveat}</span>}>
    <button
      type="button"
      aria-label={caveat}
      className="flex shrink-0 items-center text-secondary hover:text-accent-primary focus-visible:text-accent-primary"
    >
      <IconInfoCircle size={ICON_SIZE} aria-hidden />
    </button>
  </DialTooltip>
);

export default FieldCaveat;
