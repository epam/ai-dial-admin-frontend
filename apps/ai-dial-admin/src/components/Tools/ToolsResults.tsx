import { FC } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import ToolsList from '@/src/components/Tools/ToolsList';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Tool } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  tools: Tool[] | null;
  visibleTools: Tool[] | null;
  isSearching: boolean;
  disabled?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
  containerId?: string;
  toolSetName: string;
  view?: ApplicationRoute;
}

const ToolsResults: FC<Props> = ({ isSearching, ...listProps }) => {
  const t = useI18n();

  return (
    <>
      <span role="status" aria-live="polite" className="sr-only">
        {isSearching ? t(ToolsetI18nKey.SearchingTools) : ''}
      </span>
      <div
        className="relative flex-1 min-h-0 mb-3"
        role="region"
        aria-label={t(ToolsetI18nKey.Tools)}
        aria-busy={isSearching}
      >
        <div className={classNames('h-full', { invisible: isSearching })} inert={isSearching}>
          <ToolsList {...listProps} />
        </div>
        {isSearching && (
          <div aria-hidden className="absolute inset-0 flex items-center justify-center">
            <Spinner size={40} fullWidth={false} />
          </div>
        )}
      </div>
    </>
  );
};

export default ToolsResults;
