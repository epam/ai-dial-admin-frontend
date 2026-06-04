import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialGhostIconButton, DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';
import { FC } from 'react';
import Difference from '@/public/images/icons/difference.svg';

interface Props {
  count: number;
  max: number;
  onCancel: () => void;
  onCompare: () => void;
}

export const RunsBunner: FC<Props> = ({ count, max, onCancel, onCompare }) => {
  const t = useI18n();

  return (
    <div className="flex items-center bg-layer-0 justify-between p-2 mb-6 rounded-sm">
      <div className="flex items-center gap-2 text-accent-primary px-2">
        <DialGhostIconButton
          icon={<IconX size={16} />}
          onClick={onCancel}
          size={ElementSize.Small}
          className="text-accent-primary"
        />
        <span className="text-accent-primary dial-small-semi-text">
          {t(count === 1 ? TestSuitesI18nKey.SelectedRunsBannerForOne : TestSuitesI18nKey.SelectedRunsBanner, {
            count,
          })}
        </span>
        {max && <span className="text-secondary dial-small-text">({t(TestSuitesI18nKey.MaxRunsSelected)})</span>}
      </div>
      <div className="flex items-center gap-2">
        <DialNeutralButton
          label={t(ButtonsI18nKey.Compare)}
          onClick={onCompare}
          iconBefore={<Difference className="text-controls-primary" />}
        />
      </div>
    </div>
  );
};
