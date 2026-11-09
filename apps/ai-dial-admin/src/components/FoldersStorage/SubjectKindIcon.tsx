import { FC } from 'react';

import { DIAL_ICON_SIZE } from '@epam/ai-dial-ui-kit';
import { IconMail, IconShield, IconUsers, IconWorld } from '@tabler/icons-react';

import { SubjectKind } from '@/src/models/dial/org-unit';

interface Props {
  kind: SubjectKind;
}

/** Marks which kind of holder (email, group, role, everyone) a radio option or an added value stands for. */
const SubjectKindIcon: FC<Props> = ({ kind }) => {
  switch (kind) {
    case SubjectKind.GROUP:
      return <IconUsers size={DIAL_ICON_SIZE.SM} aria-hidden />;
    case SubjectKind.EVERYONE:
      return <IconWorld size={DIAL_ICON_SIZE.SM} aria-hidden />;
    case SubjectKind.DIAL_ROLE:
      return <IconShield size={DIAL_ICON_SIZE.SM} aria-hidden />;
    case SubjectKind.PERSON:
      return <IconMail size={DIAL_ICON_SIZE.SM} aria-hidden />;
    default:
      return null;
  }
};

export default SubjectKindIcon;
