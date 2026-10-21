'use client';

import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconBraces } from '@tabler/icons-react';
import { FC, useState } from 'react';

import FullscreenViewer from '@/src/components/Common/FullscreenViewer/FullscreenViewer';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionDetailRow } from '@/src/models/analytics/sessions-trace';
import { ViewerContentType } from '@/src/types/evaluation';

const ICON_SIZE = 16;

interface Props {
  session: SessionDetailRow;
}

// The whole record the detail read returned, verbatim: no key is added and no field is dropped, including the
// ones the panels leave out as stated elsewhere, because the dump is what gets pasted into a ticket or a query.
const SessionRecordJson: FC<Props> = ({ session }) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      <DialGhostIconButton
        size={ElementSize.Small}
        icon={<IconBraces size={ICON_SIZE} aria-hidden />}
        aria-label={t(SessionsTraceI18nKey.SessionJsonOpen)}
        onClick={onOpen}
      />
      {isOpen && (
        <FullscreenViewer
          isOpen
          title={session.client_session_id}
          content={JSON.stringify(session)}
          contentType={ViewerContentType.Json}
          onClose={onClose}
        />
      )}
    </>
  );
};

export default SessionRecordJson;
